export const config = {
    api: {
      bodyParser: true, // Enable built-in body parsing
    },
  };
  
  export default async function POST(req, res) {
    try {
      const data = req.body; // Parse URL-encoded data from the request body
      console.log(data); // Log the parsed data
  
      if (data.code === "PAYMENT_SUCCESS") {
        res.writeHead(302, { Location: '/order/1' }); // Redirect to the orders page
        res.end();
      } else {
        res.status(200).json({ message: "Form data received", data }); // Send a response with the parsed data
      }
    } catch (error) {
      console.error("Error processing form data:", error); // Log any errors
      res.status(500).json({ error: "Failed to process form data" }); // Send a 500 response if an error occurs
    }
  }