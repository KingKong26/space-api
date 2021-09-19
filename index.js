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
      origin: "http://localhost:3000",
    },
  }),
  socketService = require("./src/socket")
// Application level middlewares
app.use(
  compression({
    level: 6,
    threshold: 100 * 1000,
  })
);
app.use(morgan());
app.use(express.json()); //Used to parse JSON bodies
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies,
app.use(cors({ credentials: true, origin: process.env.FRONT_END_URL }));
app.use(cookieParser());
app.use("/api", userRoutes);
app.use("/api/admin", adminRoutes);

io.on("connection", (socket) => {
  console.log("a user is connected", socket.id);

  socketService(socket)

  // socket.on("join_room",(data)=>{
  //   socket.join(data);
  //   console.log(`User with ID: ${socket.id} joined room ${data}`)
  // })
  // socket.on("disconnect", () => {
  //   console.log(`User disconencted`, socket.id);
  // });
});

server.listen(PORT, () => {
  db.connectToServer(function (err) {
    if (err) console.error(err);
  });
  console.log(`Listening on Port: ${PORT}`);
});
