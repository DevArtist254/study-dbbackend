const crypto = require("crypto")
const {promisify} = require("util")
const jwt = require("jsonwebtoken")
const User = require("./../model/userModel")
const catchAsync = require("./../utils/catchAync")
const AppError = require("./../utils/appError")
const sendEmail = require("./../utils/sendEmail")

/**
 * @function signToken
 * @param {user._id} id
 * @returns token : {id, secret, expiresIn}
 */

const signToken = id => {
	return jwt.sign({id}, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	})
}

/**
 * @function createSendToken
 * @param {Object} user
 * @param {Number} statusCode
 * @param {Object} res
 */

const createSendToken = (user, statusCode, res) => {
	const token = signToken(user._id)

	const cookieOptions = {
		expires: new Date(
			Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
		),
		httpOnly: true,
	}

	if (process.env.NODE_ENV === "production") cookieOptions.secure = true

	res.cookie("jwt", token, cookieOptions)

	// Remove password from output
	user.password = undefined

	res.status(statusCode).json({
		status: "success",
		token,
		data: {
			user,
		},
	})
}

exports.signup = catchAsync(async (req, res, next) => {
	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
	})

	createSendToken(newUser, 201, res)
})

exports.login = catchAsync(async (req, res, next) => {
	const {email, password} = req.body

	if (!email || !password) {
		return next(new AppError("Please input your password or email", 400))
	}

	const user = await User.findOne({email}).select("+password")

	if (!user || !(await user.comparePassword(password, user.password))) {
		return next(new AppError("Incorrect email or password", 401))
	}

	createSendToken(user, 200, res)
})

//Protect routes that can only be accessed if your are a specific user
//Ensure the user is signed in in order to access the route

exports.protect = catchAsync(async (req, res, next) => {
	//Get token and extract the user id
	let token

	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer")
	) {
		token = req.headers.authorization.split(" ")[1]
	}

	if (!token) {
		return next(new AppError("Please sign to gain access", 404))
	}

	//Decoded token
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

	const verifiedUser = await User.findById(decoded.id)

	if (!verifiedUser) {
		return next(new AppError("User doesn't exist", 404))
	}

	req.currentUser = verifiedUser
	next()
})

exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.currentUser.role)) {
			return next(new AppError("You dont have permission", 400))
		}

		next()
	}
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
	//Get email
	const user = await User.findOne({email: req.body.email})

	//Check for existance
	if (!user) {
		return next(new AppError("There is no such email", 404))
	}

	//send reset token
	//1. Generate the reset token
	const resetToken = user.createPasswordResetToken()
	await user.save({validateBeforeSave: false})

	//3. Generate the url and message to the client
	const resetURL = `${req.protocol}://${req.get(
		"host"
	)}/api/v1/users/resetPassword/${resetToken}`
	const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`

	try {
		await sendEmail({
			email: user.email,
			subject: "Your password reser token (valid for 10 min)",
			message,
		})

		res.status(200).json({
			status: "success",
			message: "Token sent email!",
		})
	} catch (error) {
		user.passwordResetToken = undefined
		user.passwordResetExpires = undefined
		await user.save({vaildateBeforeSave: false})

		return next(
			new AppError("There was an erroe sennding your email, try again later", 500)
		)
	}
})

exports.resetPassword = catchAsync(async (req, res, next) => {
	const hashedToken = crypto
		.createHash("sha256")
		.update(req.params.token)
		.digest("hex")

	const user = await User.findOne({
		passwordResetToken: hashedToken,
	})

	if (!user) {
		return next(new AppError("Token is invalid or has expired", 400))
	}

	user.password = req.body.password
	user.passwordConfirm = req.body.passwordConfirm
	user.passwordResetToken = undefined
	user.passwordResetExpires = undefined
	await user.save()

	createSendToken(user, 200, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.currentUser.id)

	if (!user) {
		return next(new AppError("Please sign in to change your password", 400))
	}

	if (!(await user.comparePassword(user.password, req.body.currentPassword))) {
		return next(new AppError("Your password dont match try again", 400))
	}

	user.password = req.body.password
	user.passwordConfirm = req.body.passwordConfirm
	await user.save()

	createSendToken(user, 201, res)
})
