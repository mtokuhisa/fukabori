/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    /* rules you have for your project */
  ],
  options: {
    /* options you have for your project */
    doNotFollow: {
      path: 'node_modules',
    },
    // ton-of-options: see https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md
  },
}; 