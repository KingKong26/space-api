const userHelpers = require("./api/helpers/userHelpers");
let userSocketIdMap = new Map();
let activeUserSocketIdMap = new Map();
const socket = (socket, io, userId) => {
  console.log(`userId`, userId);

  socket.on("joinUser", (user) => {
    //add client to online users list
    addClientToMap(user._id, socket.id);
    console.log("joinUser userSocketIdMap: ", userSocketIdMap.entries());
    console.log(`joinUser size of map: `, userSocketIdMap.size);
    console.log("joinUser number of clients", io.engine.clientsCount);
  });

  socket.on("ACTIVE",async (user) => {
    //add client to online users list
    addClientToActiveMap(user._id, socket.id);
    let userData = await userHelpers.getDetails(user._id);
    let clientUserIds = [...userData.friends];
    if (clientUserIds.length > 0) {
      for (id of clientUserIds) {
        let recipientSocketIds = userSocketIdMap.get(id);
        console.log(`recipientSocketIds`, recipientSocketIds);
        if (recipientSocketIds) {
          for (let socketId of recipientSocketIds) {
            console.log(`socketId`, socketId);
            socket.to(socketId).emit("SET_ACTIVE_CLIENT", user);
          }
        }
      }
    }
    console.log("active userSocketIdMap: ", activeUserSocketIdMap.entries());
    console.log(`active size of map: `, activeUserSocketIdMap.size);
    console.log("active number of clients", io.engine.clientsCount);
  });

  socket.on("disconnect", () => {
    console.log(`userId,socket.id`, userId, socket.id);
    removeClientFromMap(userId, socket.id);
    // socket.removeAllListeners();
    console.log(`disconnected: `, socket.id);
    console.log(`disconnect userSocketIdMap`, userSocketIdMap.entries());
    console.log(`disconnect size of map: `, userSocketIdMap.size);
    console.log("disconnect number of clients", io.engine.clientsCount);
  });

  socket.on("LOGOUT", (id) => {
    try {
      console.log(`logout`, id);
    } catch (error) {
      console.log(`error.message`, error.message);
    }
    console.log(`logout socket`, socket.id);
    removeClientFromMap(id, socket.id);
    socket.emit("callback", "logged out");
    socket.to(`${socket.id}`).emit("resetParams");
    console.log(`logout userSocketIdMap`, userSocketIdMap.entries());
    console.log(`logout size of map: `, userSocketIdMap.size);
    console.log("logout number of clients", io.engine.clientsCount);
  });

  socket.on("LIKE_POST", async (newPost) => {
    console.log(`newPost`, newPost);
    let userData = await userHelpers.getDetails(newPost.userId); //get user details of the post which got the like
    console.log(`userData`, userData);
    let clientUserIds = [...userData.friends, userData._id.toString()];
    console.log(`clientUserIds`, clientUserIds);
    if (clientUserIds.length > 0) {
      for (id of clientUserIds) {
        let recipientSocketIds = userSocketIdMap.get(id);
        console.log(`recipientSocketIds`, recipientSocketIds);
        if (recipientSocketIds) {
          for (let socketId of recipientSocketIds) {
            console.log(`socketId`, socketId);
            socket.to(socketId).emit("LIKE_TO_CLIENT", newPost);
          }
        }
      }
    }
  });

  socket.on("MESSAGE_SENT", async (message) => {
    console.log(`message`, message);
    let recipientSocketIds = userSocketIdMap.get(message.recipient);
    console.log(`recipientSocketIds`, recipientSocketIds);
    if (recipientSocketIds) {
      for (let socketId of recipientSocketIds) {
        console.log(`socketId`, socketId);
        socket.to(socketId).emit("SEND_MESSAGE_TO_CLIENT", message);
      }
    }
  });

  socket.on("error", function (err) {
    console.log(err, "socket error");
  });
};

module.exports = socket;

const addClientToMap = (userId, socketId) => {
  if (!userSocketIdMap.has(userId)) {
    //when user is joining first time
    userSocketIdMap.set(userId, new Set([socketId]));
  } else {
    //user had already joined from one client and now joining using another client
    userSocketIdMap.get(userId).add(socketId);
  }
};

const removeClientFromMap = (userId, socketId) => {
  if (userSocketIdMap.has(userId)) {
    let userSocketIdSet = userSocketIdMap.get(userId);
    let userActiveSocketIdSet = activeUserSocketIdMap.get(userId);
    // Map is of reference type, so..
    userSocketIdSet.delete(socketId);
    userActiveSocketIdSet && userActiveSocketIdSet.delete(socketId);
    //if there are no clients for a user, remove that user from online
    // list(map);
    if (userSocketIdSet.size == 0) {
      userSocketIdMap.delete(userId);
    }
    if (userActiveSocketIdSet && userActiveSocketIdSet.size == 0) {
      activeUserSocketIdMap.delete(userId);
    }
  }
};

const addClientToActiveMap = (userId, socketId) => {
  if (!activeUserSocketIdMap.has(userId)) {
    //when user is joining first time
    activeUserSocketIdMap.set(userId, new Set([socketId]));
  } else {
    //user had already joined from one client and now joining using another client
    activeUserSocketIdMap.get(userId).add(socketId);
  }
};

// socket.on("LIKE_POST", async (newPost) => {
//   console.log(`users`, users);
//   console.log(`newPost`, newPost);
//   let userData = await userHelpers.getDetails(newPost.userId); //get user details of the post which got the like
//   console.log(
//     `userData.friends,newPost.userId`,
//     userData.friends,
//     newPost.userId.toString()
//   );
//   const ids = [...userData.friends, newPost.userId];
//   console.log(`ids`, ids);
//   const clients = users.filter((user) => ids.includes(user.id));
//   console.log(`clients`, clients);
//   if (clients.length > 0) {
//     clients.forEach((client) => {
//       socket.to(`${client.socketId}`).emit("LIKE_TO_CLIENT", newPost);
//     });
//   }
// });
// socket.on("REQUEST_SENT", async (updatedUser) => {
//   let userData = await userHelpers.getUserDetailsHelper(updatedUser._id);
//   console.log(userData, "updated user in request sent");
//   const clients = users.filter((e) => e.id === updatedUser._id);
//   console.log(`client`, clients);
//   if (clients.length > 0) {
//     clients.forEach((client) => {
//       console.log(`client.socketId`, client.socketId);
//       socket
//         .to(`${client.socketId}`)
//         .emit("REQUEST_SENT_TO_CLIENT", userData);
//     });
//   }
//   console.log(`user`, users);
// });
// socket.on("REJECT_REQUEST", async (id) => {
//   console.log("reject_request socket");
//   console.log("response", id);
//   let updatedProfile = await userHelpers.getUserDetailsHelper(id);
//   console.log(`updatedProfile`, updatedProfile);
//   const clients = users.filter((e) => e.id === id);
//   clients.length > 0 &&
//     clients.forEach((client) =>
//       socket
//         .to(`${client.socketId}`)
//         .emit("REJECT_REQUEST_TO_CLIENT", updatedProfile)
//     );
//   console.log(`user`, users);
// });
