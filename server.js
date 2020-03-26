const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const fileupload = require("express-fileupload");
const path = require("path");
const errorHandler = require("./middleware/error");

dotenv.config({ path: "./config/config.env" });

const posts = require("./routes/posts");
const comments = require("./routes/comments");
const users = require("./routes/users");

// Connect to mongodb
connectDB();

const app = express();

app.use(express.json());
app.use(cors());

app.use(fileupload());

// Making public folder static
app.use(express.static(path.join(__dirname, "public")));

// Route for each model
app.use("/api/posts", posts);
app.use("/api/comments", comments);
app.use("/api/users", users);

// Serve static file for production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
  );
}

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server up and running on port ${PORT}`));
