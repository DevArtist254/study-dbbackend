const User = require("../model/userModel")
const APIFeatures = require("../utils/apiFeatures")
const AppError = require("../utils/appError")
const catchAync = require("../utils/catchAync")

function filterObj(obj, arr) {
	const newObj = {}
	Object.keys(obj).forEach(el => {
		if (allowedFields.includes(el)) newObj[el] = obj[el]
	})
}

exports.getAllUsers = catchAync(async (req, res, next) => {
	const users = await User.find({})

	res.status(200).json({
		status: "success",
		requestedAt: req.requestedAt,
		results: users.length,
		data: {
			users,
		},
	})
})

/**
 * Password checker
 * Object filter
 * find one the person and update
 * responsed with what was updated
 */
exports.updateMe = catchAync(async (req, res, next) => {
	if (req.body.password || req.body.passwordConfirm) {
		return next(new AppError("This route does not allow password updates", 400))
	}

	//filter out unwanted
	const filterBody = filterObj(req.body, "name", "email")

	const updatedUser = await User.findByIdAndUpdate(
		req.currentUser._id,
		filterBody,
		{new: true, runValidators: true}
	)

	res.status(200).json({
		status: "success",
		data: {
			updatedUser,
		},
	})
})

exports.deleteMe = catchAync(async (req, res, next) => {
	const deletedUser = await User.findByIdAndUpdate(
		req.currentUser._id,
		{active: false},
		{runValidators: true}
	)

	res.status(200).json({
		status: "success",
		data: {
			deletedUser,
		},
	})
})
