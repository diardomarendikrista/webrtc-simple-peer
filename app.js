const cors = require("cors");
const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
const http = require("http").createServer(app);

const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.urlencoded({ extended: false, limit: "15360mb" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: `server is running (server wes mlaku)` });
});

const connectedUser = [];

io.on("connection", (socket) => {
  socket.emit("me", socket.id);
  // update connectedUser

  connectedUser.push({ id: socket.id, name: "" });

  io.emit("connectedUser", connectedUser);
  console.log(connectedUser, "connectedUser");

  socket.on("disconnect", () => {
    socket.broadcast.emit("userdisconnected", socket.id);
    console.log(socket.id, "user disconnected");

    const index = connectedUser.map((item) => item.id).indexOf(socket.id);
    // only splice array when item is found
    if (index > -1) {
      connectedUser.splice(index, 1); // 2nd parameter means remove one item only
      socket.broadcast.emit("connectedUser", connectedUser);
      console.log(connectedUser, "connectedUser");
    }
  });

  // Change Name
  socket.on("changeName", ({ fromId, newName }) => {
    connectedUser.map((item) => {
      if (item.id === fromId) {
        item.name = newName;
      }
    });
    io.emit("connectedUser", connectedUser);
    io.emit("changeNameToChats", { fromId, newName });
  });

  // Chat Purpose
  socket.on("sendChat", ({ fromId, name, message, time }) => {
    console.log({ fromId, name, message, time }, "sendChat");
    socket.broadcast.emit("newChat", {
      fromId,
      name,
      message,
      time,
    });
  });

  // Video Call Purpose
  socket.on("calluser", ({ userToCall, signalData, fromId, name }) => {
    io.to(userToCall).emit("usercalling", { signal: signalData, fromId, name });
  });

  socket.on("answercall", (data) => {
    io.to(data.to).emit("callaccepted", {
      signal: data.signal,
      name: data.name,
      id: data.id,
    });
  });

  socket.on("leavecall", ({ idPartner, leaverId }) => {
    console.log(leaverId, "leave call", idPartner);
    io.to(idPartner).emit("partnerdisconnect", { leaverId });
  });
});

http.listen(port, () =>
  console.log(`server listening on http://localhost:${port}`)
);
