
module.exports = plugin;

function plugin(options) {
  console.log("initializing plugin...");
  return this;
}

plugin.prototype.setDefaultOptions = function(options) {
  console.log("setting default options...");
};
