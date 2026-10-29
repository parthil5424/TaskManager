import app from "./app.js";
import "dotenv/config";
import connectDb from "./config/db.js";

const PORT = process.env.PORT;

const startServer = async () => {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`App Is Listenig On ${PORT} PORT`);
  });
};

startServer();
