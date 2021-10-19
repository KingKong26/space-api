require("dotenv").config();
const express = require("express"),
  http = require("http"),
  app = express(),
  server = http.createServer(app),
  morgan = require("morgan"),
  PORT = process.env.PORT || 3000,
  userRoutes = require("./src/api/routes/userRoutes"),
  adminRoutes = require("./src/api/routes/adminRoutes"),
  db = require("./src/config/dbConnection"),
  cookieParser = require("cookie-parser"),
  cors = require("cors"),
  compression = require("compression"),
  io = require("socket.io")(server, {
    cors: {
      origin: process.env.FRONT_END_URL,
    },
    pingTimeout: 180000,
    pingInterval: 25000,
  }),
 socketService = require("./src/socket").socket

// Application level middlewares
app.use(
  compression({
    level: 6,
    threshold: 100 * 1000,
  })
);
morgan.token("username", function (req, res) {
  var username = req.user ? req.user._id : "Guest";
  return username;
});
app.use(morgan(":username :date :method :url"));
app.use(express.json()); //Used to parse JSON bodies
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies,
app.use(cors({ credentials: true, origin: process.env.FRONT_END_URL }));
app.use(cookieParser());
app.use("/api", userRoutes);
app.use("/api/admin", adminRoutes);
// io.eio.pingTimeout = 120000;
// io.eio.pingInterval = 5000;
io.on("connection", (socket) => {
  console.log("a user is connected", socket.id);
  console.log("number of clients", io.engine.clientsCount);
  let userId = socket.handshake.query.userId;
  socketService(socket, io, userId);
});

server.listen(PORT, () => {
  db.connectToServer(function (err) {
    if (err) console.error(err);
  });
  console.log(`Listening on Port: ${PORT}`);
});
