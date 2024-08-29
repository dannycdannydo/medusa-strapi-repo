module.exports = {
  async index(ctx, next) {
    // Called by GET /hello
    try {
      const token = ctx.request.query.token; // Get token from query parameter

      if (!token) {
        // Handle missing token gracefully
        return ctx.send({ error: 'Missing required token parameter' }, 400);
      }

      const validationResult = await handlePost(token); // Call validation function

      ctx.send(validationResult);
    } catch (error) {
      console.error(error);
      ctx.send({ error: 'An error occurred during validation' }, 500);
    }
  }
};

async function handlePost(token) {
  // Validate the token by calling the
  // "/siteverify" API endpoint.
  let formData = new FormData();
  formData.append("secret", process.env.TURNSTILE_SECRET);
  formData.append("response", token);

  const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const result = await fetch(url, {
    body: formData,
    method: "POST",
  });

  const outcome = await result.json();
  if (outcome.success) {
    const response = {
      status: 'success',
      message: 'Validation successful'
    };
    return response; // Return the response object
  } else {
    const response = {
      status: 'error',
      message: 'Validation failed'
    };
    return response; // Return the response object
  }
}
