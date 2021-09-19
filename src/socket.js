const userHelpers = require("./api/helpers/userHelpers");
let users = [];

const socket = (socket) => {
  console.log(users, "users in socket outside");
  socket.on("joinUser", (user) => {
    users.push({ id: user._id, socketId: socket.id, friends: user.friends });
    console.log(users, "users in socket");
  });

  socket.on("disconnect", () => {
    const data = users.find((user) => user.socketId === socket.id);
    console.log(`data`, data);

    // if(data){
    //     const clients = users.filter(user =>
    //         data.friends.find(item => item._id === user.id)
    //     )

    //     if(clients.length > 0){
    //         clients.forEach(client => {
    //             socket.to(`${client.socketId}`).emit('CheckUserOffline', data.id)
    //         })
    //     }

    //     if(data.call){
    //         const callUser = users.find(user => user.id === data.call)
    //         if(callUser){
    //             users = EditData(users, callUser.id, null)
    //             socket.to(`${callUser.socketId}`).emit('callerDisconnect')
    //         }
    //     }
    // }

    users = users.filter((user) => user.socketId !== socket.id);
    console.log(users, "users in socket disconnect");
  });

  socket.on("LIKE_POST", async (newPost) => {
    console.log(`users`, users);
    console.log(`newPost`, newPost);
    let userData = await userHelpers.getDetails(newPost.userId); //get user details of the post which got the like
    console.log(
      `userData.friends,newPost.userId`,
      userData.friends,
      newPost.userId.toString()
    );
    const ids = [...userData.friends, newPost.userId];
    console.log(`ids`, ids);
    const clients = users.filter((user) => ids.includes(user.id));
    console.log(`clients`, clients);

    if (clients.length > 0) {
      clients.forEach((client) => {
        socket.to(`${client.socketId}`).emit("LIKE_TO_CLIENT", newPost);
      });
    }
  });

  socket.on("REQUEST_SENT", async (updatedUser) => {
    let userData = await userHelpers.getUserDetailsHelper(updatedUser._id);
    console.log(userData, "updated user in request sent");
    const clients = users.filter((e) => e.id === updatedUser._id);
    console.log(`client`, clients);
    if (clients.length > 0) {
      clients.forEach((client) => {
        console.log(`client.socketId`, client.socketId);
        socket
          .to(`${client.socketId}`)
          .emit("REQUEST_SENT_TO_CLIENT", userData);
      });
    }
    console.log(`user`, users);
  });

  socket.on("REJECT_REQUEST", async (id) => {
    console.log("reject_request socket");
    console.log("response", id);
    let updatedProfile = await userHelpers.getUserDetailsHelper(id);
    console.log(`updatedProfile`, updatedProfile);
    const clients = users.filter((e) => e.id === id);
    clients.length > 0 &&
      clients.forEach((client) =>
        socket
          .to(`${client.socketId}`)
          .emit("REJECT_REQUEST_TO_CLIENT", updatedProfile)
      );
    console.log(`user`, users);
  });

  socket.on("error", function (err) {
    console.log(err, "socket error");
  });
};

module.exports = socket;
