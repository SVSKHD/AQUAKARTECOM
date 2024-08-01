export default async function GET(req, res) {
  try {
    const { query } = req; // Extract query parameters from the request
    console.log(query); // Log the query parameters

    // Example of using Object.assign if needed
    const response = Object.assign({}, { message: "Query parameters received", query });

    if (query.code === "PAYMENT_SUCCESS") {
      res.writeHead(302, { Location: '/order/1' }); // Redirect to the orders page
      res.end();
    } else {
      res.status(200).json(response); // Send a response with the query parameters
    }
  } catch (error) {
    console.error("Error processing query parameters:", error); // Log any errors
    res.status(500).json({ error: "Failed to process query parameters" }); // Send a 500 response if an error occurs
  }
}