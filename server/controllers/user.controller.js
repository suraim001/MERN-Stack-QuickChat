import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

// Signup a new user
export const signup = async (req, res)=>{
    const { fullName, email, password, bio } = req.body;
    try {
        if(!fullName || !email || !password || !bio){
            return res.json({success: false, message: "Missing Details"})
        }
        const user = await User.findOne({email});
        if(user){
            return res.json({success: false, message: "Account already exist on this email"})
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({ fullName, email, password: hashedPassword, bio });

        const token = generateToken(newUser._id);

        res.json({success: true, userData: newUser, token, message: "Account created successfully."});

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

// Controller Function for User Login
export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userData = await User.findOne({email});
        if(!userData){
            return res.json({success: false, message: "Unable to login! Please check your email/password"})
        }

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if(!isPasswordCorrect){
            return res.json({success: false, message: "Invalid credentials!"});
        }

        const token = generateToken(userData._id);

        res.json({success: true, userData, token, message: "Login Successful."});

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}

// Controller function to check if the user is authenticated
export const checkAuth = (req, res)=>{
    res.json({success: true, user: req.user});
}

// Controller function to update user profile details

export const updateProfile = async (req, res) => {
    try {
        // console.log("req.user content:", req.user);
        // console.log("Type of req.user._id:", typeof req.user?._id);
        const { profilePic, fullName, bio } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Build dynamic update object to avoid overwriting fields with undefined
        const updateData = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (bio !== undefined) updateData.bio = bio;

        if (profilePic) {
            const upload = await cloudinary.uploader.upload(profilePic);
            updateData.profilePic = upload.secure_url;
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            updateData,
            { returnDocument: "after", runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
