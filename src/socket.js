const userHelpers = require("./api/helpers/userHelpers");
let userSocketIdMap = new Map();
let activeUserSocketIdMap = new Map();

const socket = (socket, io, userId) => {
  socket.on("JOIN_USER", (user) => {
    //add client to online users list
    addClientToMap(user._id, socket.id);
  });

  socket.on("ACTIVE", async (user) => {
    //add client to online users list
    addClientToActiveMap(user._id, socket.id);
    let userData = await userHelpers.getDetails(user._id);
    let clientUserIds = [...userData.friends];
    if (clientUserIds.length > 0) {
      for (id of clientUserIds) {
        let recipientSocketIds = userSocketIdMap.get(id);
        if (recipientSocketIds) {
          for (let socketId of recipientSocketIds) {
            socket.to(socketId).emit("SET_ACTIVE_CLIENT", user);
          }
        }
      }
    }
  });

  socket.on("disconnect", () => {
    removeClientFromMap(userId, socket.id);
    // socket.removeAllListeners();
  });

  socket.on("LOGOUT", (_id) => {
    removeClientFromMap(_id, socket.id);
    socket.emit("callback", "logged out");
    socket.to(`${socket.id}`).emit("resetParams");
    updateUserFriends({_id:_id,active:false}, socket);
  });

  socket.on("LIKE_POST", async (newPost) => {
    let userData = await userHelpers.getDetails(newPost.userId); //get user details of the post which got the like
    let clientUserIds = [...userData.friends, userData._id.toString()];
    if (clientUserIds.length > 0) {
      for (id of clientUserIds) {
        let recipientSocketIds = userSocketIdMap.get(id);
        if (recipientSocketIds) {
          for (let socketId of recipientSocketIds) {
            socket.to(socketId).emit("LIKE_TO_CLIENT", newPost);
          }
        }
      }
    }
  });

  socket.on("MESSAGE_SENT", async (message) => {
    let recipientSocketIds = userSocketIdMap.get(message.recipient);
    if (recipientSocketIds) {
      for (let socketId of recipientSocketIds) {
        socket.to(socketId).emit("SEND_MESSAGE_TO_CLIENT", message);
      }
    }
  });

  socket.on("SEND_NOTIFICATION", async (notifyObj) => {
    notifyObj.recipients.map((recipient) => {
      let recipientSocketIds = userSocketIdMap.get(recipient);
      if (recipientSocketIds) {
        for (let socketId of recipientSocketIds) {
          socket.to(socketId).emit("SEND_NOTIFY_TO_CLIENT", notifyObj);
        }
      }
    });
  });

  socket.on("error", function (err) {
    console.log(err, "socket error");
  });
};

module.exports = { socket, activeUserSocketIdMap };

const updateUserFriends = async(user , socket) => {
  let userData = await userHelpers.getDetails(user._id);
  let clientUserIds = [...userData.friends];
  if (clientUserIds.length > 0) {
    for (id of clientUserIds) {
      let recipientSocketIds = userSocketIdMap.get(id);
      if (recipientSocketIds) {
        for (let socketId of recipientSocketIds) {
          socket.to(socketId).emit("UPDATE_ACTIVE", user);
        }
      }
    }
  }
};

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
