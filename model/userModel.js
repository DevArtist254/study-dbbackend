const crypto = require("crypto")
const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema({
	// required string
	name: {
		type: String,
		required: [true, "Please tell us your name"],
	},
	//required vaildated unique email lowercase
	email: {
		type: String,
		unique: true,
		required: [true, "Please enter a vaild email address"],
		lowercase: true,
		validate: [validator.isEmail, "This is not a valid email"],
	},
	photo: String,
	//role options 'user'-d guide lead-guide admin
	role: {
		type: String,
		default: "user",
		enum: ["user", "guide", "lead-guide", "admin"],
	},
	// required min-8char selected false,
	password: {
		type: String,
		required: [true, "Please enter a password"],
		minlength: 8,
		select: false,
	},
	//On save and create compare both password #required
	passwordConfirm: {
		type: String,
		required: [true, "Passwords don't match"],
		validate: {
			validator: function(el) {
				return el === this.password
			},
			message: "passwords don't match",
		}
	},
	passwordChangeAt: Date,
	passwordResetToken: String,
	passwordExpires: Date,
	//check of the user activity
	active: {
		type: Boolean,
		select: false,
		default: true,
	},
})

/*Before is save or create a user's password
 * Check if password was recently modified
 * Hash the incoming password
 * Clear the password confirm
 */
//Middleware on create or signup
userSchema.pre("save", async function(next) {
	if (!this.isModified("password")) return next()

	this.password = await bcrypt.hash(this.password, 12)

	this.passwordConfirm = undefined

	next()
})

//Middleware for on update
userSchema.pre("save", async function(next) {
	if (!this.isModified("password") || this.isNew) return next()

	this.passwordChangeAt = Date.now() - 1000
	next()
})

//Mid meth for compare passwords
userSchema.methods.comparePassword = async function(
	candidatePassword,
	userPassword
) {
	return await bcrypt.compare(candidatePassword, userPassword)
}

//checkIfPAssword was recently changed

userSchema.methods.isPasswordChangedAfter = function(JWTTimeStamp) {
	if (this.passwordChangeAt) {
		const changedTimeStamp = parseInt(this.passwordChangeAt.getTime() / 1000, 10)

		return JWTTimeStamp < changedTimeStamp
	}

	return false
}

/**
 * @function createPasswordResetToken
 * reset token crypto byte 32
 * set password reset token update(reset token)
 * set an expire time
 */

userSchema.methods.createPasswordResetToken = function() {
	const resetToken = crypto.randomBytes(32).toString("hex")

	this.passwordResetToken = crypto
		.createHash("sha256")
		.update(resetToken)
		.digest("hex")

	console.log({resetToken}, this.passwordResetToken)

	this.passwordResetExpires = Date.now() + 10 * 60 * 1000

	return resetToken
}

const User = mongoose.model("User", userSchema)

module.exports = User
