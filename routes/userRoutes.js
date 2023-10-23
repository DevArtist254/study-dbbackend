const express = require("express")
const {
	signup,
	protect,
	login,
	restrictTo,
	forgotPassword,
	resetPassword,
	updatePassword,
} = require("./../controllers/authController")
const {
	updateMe,
	getAllUsers,
	deleteMe,
} = require("../controllers/userController")

const Router = express()

Router.post("/signup", signup)
Router.post("/login", login)
Router.post("/forgotPassword", forgotPassword)
Router.post("/resetPassword/:token", resetPassword)

Router.patch("/updateMyPassword", protect, updatePassword)

Router.patch("/updateMe", protect, updateMe)
Router.delete("/deleteMe", protect, deleteMe)

Router.get("/", protect, restrictTo("admin"), getAllUsers)

// Router.get("/:id", getAUser)
// Router.patch("/:id", protect, restrictTo["admin"], updateAUser)

module.exports = Router
