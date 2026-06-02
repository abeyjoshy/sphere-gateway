import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import routes from "./src/routes/routes.js"

import mongooseClient from "./src/config/mongod.conf.js";

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

async function initializeServer() {
    try {
        // ROUTES
        app.use("/sphere/api/v1/", routes);

        // START SERVER
        const port = process.env.APP_PORT || 3000;
        app.listen(port, () => {
            console.log(`SPHERE Gateway is now listening at Port: ${port}`);
        });
    } catch (error) {
        console.error("Failed to initialize SPHERE Gateway server:", error);
        process.exit(1); // Exit the process with a failure code
    }
}
// CALL THE ASYNC INITIALIZATION FUNCTION
initializeServer();


// Connect to MongoDB
mongooseClient.connect()