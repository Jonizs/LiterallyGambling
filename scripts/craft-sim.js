/* Rolls a pile of crafts per recipe and reports what they sell for.
   Usage: node scripts/craft-sim.js [runs]  (default 10000) */
"use strict";
var fs = require("fs"), path = require("path"), vm = require("vm");

var SRC = path.join(__dirname, "..", "src");
var FILES = ["stats.js", "icons.js", "artifacts.js", "parts.js", "recipes.js",
  "gather.js", "refine.js", "compound.js", "game.js"];

// The game modules hang off window and expect a DOM only for drawing, which
// nothing here touches.
var win = {};
win.window = win;
win.document = { createElement: function () {
  return { getContext: function () { return null; }, style: {} };
} };
var ctx = vm.createContext(win);
FILES.forEach(function (file) {
  vm.runInContext(fs.readFileSync(path.join(SRC, file), "utf8"), ctx, file);
});

var G = win.Game, S = win.Stats;
var runs = parseInt(process.argv[2], 10) || 10000;

function stockedState() {
  var state = G.createState();
  state.level = 99;
  state.silver = 1e12;
  [state.materials, state.resources, state.bars, state.alloys, state.parts]
    .forEach(function (pool) {
      Object.keys(pool).forEach(function (key) { pool[key] = 1e9; });
    });
  win.Recipes.LIST.forEach(function (recipe) {
    if (recipe.research) state.known.push(recipe.key);
  });
  return state;
}

var rows = [];
win.Recipes.LIST.filter(function (r) { return r.kind === "weapon" && !r.mystery; })
  .forEach(function (recipe) {
    var state = stockedState();
    var total = 0, best = 0, worst = Infinity, tiers = {};
    for (var i = 0; i < runs; i++) {
      var out = G.forge(state, recipe);
      if (!out.ok) throw new Error(recipe.key + ": " + out.reason);
      var item = out.item;
      var price = G.sellPrice(item);
      total += price;
      if (price > best) best = price;
      if (price < worst) worst = price;
      tiers[item.tier] = (tiers[item.tier] || 0) + 1;
      state.inventory.length = 0;   // sold as it comes off the anvil
    }
    rows.push({
      name: recipe.name,
      avg: Math.round(total / runs),
      low: worst,
      high: best,
      cost: Math.round(G.recipeValue(recipe)),
      tiers: tiers
    });
  });

var pad = function (s, n) { s = String(s); return s + " ".repeat(Math.max(0, n - s.length)); };
console.log(runs + " crafts per weapon, sold straight off the anvil\n");
console.log(pad("weapon", 18) + pad("avg", 12) + pad("min", 10) + pad("max", 12) +
  pad("material worth", 16) + "margin");
rows.forEach(function (row) {
  console.log(pad(row.name, 18) + pad(row.avg.toLocaleString(), 12) +
    pad(row.low.toLocaleString(), 10) + pad(row.high.toLocaleString(), 12) +
    pad(row.cost.toLocaleString(), 16) +
    (row.cost ? (row.avg / row.cost).toFixed(2) + "x" : "-"));
});
