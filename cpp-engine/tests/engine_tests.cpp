#include "core/Engine.hpp"
#include <iostream>
#include <stdexcept>
using namespace rescue;
void check(bool value, const char *message) {
  if (!value)
    throw std::runtime_error(message);
}
int main() {
  try {
    DisasterMap map;
    auto p = Dijkstra::calculate(map, 104, 14);
    check(p.distance == int(p.route.size()) - 1, "distance");
    check(p.route.front() == 104 && p.route.back() == 14, "endpoints");
    for (size_t i = 0; i < p.route.size(); i++) {
      check(map.passable(p.route[i]), "blocked traversal");
      if (i)
        check(abs(p.route[i] / Cols - p.route[i - 1] / Cols) +
                      abs(p.route[i] % Cols - p.route[i - 1] % Cols) ==
                  1,
              "adjacency");
    }
    check(Dijkstra::calculate(map, -1, 9).distance == -1, "invalid start");
    check(Dijkstra::calculate(map, 16, 14).distance == -1, "blocked start");
    check(Dijkstra::calculate(map, 2, 2).distance == 0, "identity path");
    GameManager g;
    check(g.state()["events"][0]["tick"] == 0, "event serialization");
    check(g.state()["events"][0]["text"].is_string(), "event text");
    g.command("start");
    g.command("assign", 0, 0);
    auto initial = g.state();
    int steps = initial["vehicles"][0]["route"].size() - 1;
    bool rejected = false;
    try {
      g.command("assign", 1, 0);
    } catch (...) {
      rejected = true;
    }
    check(rejected, "duplicate assignment");
    g.command("pause");
    g.command("tick");
    check(g.state()["ticks"] == 0, "paused ticking");
    g.command("start");
    for (int i = 0; i < steps; i++)
      g.command("tick");
    auto s = g.state();
    check(s["rescued"] == 1, "rescue delivery");
    check(s["score"] == 325, "score");
    check(s["vehicles"][0]["fuel"] == 100 - steps, "fuel");
    check(s["vehicles"][0]["supplies"] == 4, "medical supplies");
    int occupied = 0;
    for (auto f : s["facilities"])
      if (f["type"] == "hospital")
        occupied += f["occupied"].get<int>();
    check(occupied == 1, "bed occupancy");
    auto save = g.save();
    GameManager loaded;
    loaded.load(save);
    check(loaded.state() == s, "save roundtrip");
    rejected = false;
    try {
      loaded.load("{\"version\":1,\"commands\":[[\"assign\",999,999]]}");
    } catch (...) {
      rejected = true;
    }
    check(rejected, "invalid save");
    check(loaded.state() == s, "atomic load");
    Hospital h(0, 2, "Test");
    h.reserved = 4;
    check(!h.available(), "reserved beds");
    h.reserved = 0;
    h.occupied = 4;
    check(!h.available(), "hospital full");
    Game direct;
    direct.start();
    direct.vehicles[0]->fuel = 0;
    rejected = false;
    try {
      direct.assign(0, 0);
    } catch (...) {
      rejected = true;
    }
    check(rejected, "insufficient fuel");
    GameManager full;
    full.command("start");
    for (int i = 0; i < 600 && full.state()["phase"] != "finished"; i++) {
      auto st = full.state();
      for (const auto &v : st["vehicles"])
        if (v["status"] == "available")
          for (const auto &c : st["civilians"])
            if (c["status"] == "waiting") {
              try {
                full.command("assign", v["id"], c["id"]);
                break;
              } catch (...) {
              }
            }
      full.command("tick");
    }
    check(full.state()["rescued"] == 8, "complete operation");
    check(full.state()["phase"] == "finished", "game over");
    for (auto f : full.state()["facilities"])
      if (f["type"] == "hospital")
        check(f["occupied"].get<int>() <= f["capacity"].get<int>(), "capacity exceeded");
    std::cout << "All engine tests passed\n";
  } catch (const std::exception &e) {
    std::cerr << e.what() << '\n';
    return 1;
  }
}
