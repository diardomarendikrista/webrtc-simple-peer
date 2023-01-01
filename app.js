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

io.on("connection", (socket) => {
  socket.emit("me", socket.id);
  console.log(socket.id, "user connected");

  socket.on("disconnect", () => {
    socket.broadcast.emit("userdisconnected", socket.id);
    console.log(socket.id, "user disconnected");
  });

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
