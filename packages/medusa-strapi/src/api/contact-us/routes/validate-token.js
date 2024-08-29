module.exports = {
  routes: [
    {
      config: {
        auth: false,
        policies: [],
      },
      method: "GET",
      path: "/validate-token",
      handler: "validate-token.index",
    },
  ],
};
