const { createClient } = require("redis");
const http = require("http");
const fs = require("fs");
const client = createClient({
  url: "redis://127.0.0.1:6379",
});

client.on("error", (err) => console.log("Redis Client Error", err));

client.connect();

const path = require("path");
const replaceTemplate = require("./modules/replace-template");
const tempOverview = fs.readFileSync(
  `${__dirname}/templates/overview.html`,
  "utf-8"
);



server=http.createServer(async(req, res) => {


  if (req.url.startsWith("/public")){
    const filePath = path.join(__dirname, req.url);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
      } else {
        res.writeHead(200, { "Content-Type": getContentType(filePath) });
        res.end(data);
      }
    });
  }
  else if(req.url==='/'){
    res.writeHead(200, { "Content-type": "text/html" });
    let output =replaceTemplate(tempOverview,[])
    res.end(output);
  } 
  else if (req.method == "POST" && req.url === "/send-to-redis") {
    let body='';
    req.on("data", (chunk) => {
      body+=chunk.toString();
    });

    req.on("end", async () => {
      const  message= JSON.parse(body).message;

      try {
        await client.rPush("newlist", message);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "success",
            message: "Data sent to Redis",
            data: { message},
          })
        );
      } catch (error) {
        console.error("Error writing to Redis:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "error",
            message: "Failed to write to Redis",
          })
        );
      }
    });
  }
  else if(req.url==='/load'){
    try {
      const data =await client.lRange('newlist', 0, -1);
      const output = replaceTemplate(tempOverview, data);
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(output);
    } catch (error) {
      console.error("Error reading from Redis:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "error",
          message: "Failed to read from Redis",
        })
      );
    }
  }
   else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "error", message: "Not Found" }));
  }
});


function getContentType(filePath) {
    const extname = path.extname(filePath);
    switch (extname) {
      case ".html":
        return "text/html";
      case ".css":
        return "text/css";
  
      default:
        return "text/plain";
    }
  }



server.listen(27001, () => {
  console.log("Server is running on http://localhost:27001");
});
