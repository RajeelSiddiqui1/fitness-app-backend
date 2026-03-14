import mongoose from "mongoose"
import User from "../model/userSchema.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { sendMail } from "../lib/mail.js"
import { otpEmail } from "../lib/emails/otpEmail.js"
import { passwordResetOtpEmail } from "../lib/emails/passwordResetOtpEmail.js"
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export async function userRegister(req, res) {
  try {
    const { userName, email, password, age, country, city, gender } = req.body

    if (!userName || !email || !password || !age || !gender) {
      return res.status(400).json({ message: "All required fields must be filled" })
    }


    const userNameExists = await User.findOne({ userName })
    if (userNameExists) return res.status(409).json({ message: "Username already exists" })


    const existingUser = await User.findOne({ email })


    if (existingUser && !existingUser.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      existingUser.otp = otp
      existingUser.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await existingUser.save()

      await sendMail({
        to: existingUser.email,
        subject: "R-fit OTP Verification",
        html: otpEmail(otp)
      })

      return res.status(200).json({
        message: "Account exists but not verified. New OTP has been sent."
      })
    }


    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "User already exists. Please login." })
    }


    const hashedPassword = await bcrypt.hash(password, 12)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    const newUser = new User({
      userName,
      email,
      age,
      country,
      city,
      gender,
      password: hashedPassword,
      otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      isVerified: false
    })

    await newUser.save()

    // SEND OTP
    await sendMail({
      to: newUser.email,
      subject: "R-fit OTP Verification",
      html: otpEmail(otp)
    })
    return res.status(201).json({ message: "User registered successfully. OTP sent to email." })

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}



export async function userLogin(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }


    const user = await User.findOne({ email: email })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!user.isVerified) return res.status(403).json({ message: "Account not verified. Please verify OTP first." })

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return res.status(200).json({
      message: "Login successfull",
      token,
      user: {
        id: user._id,
        email: user.email,
        email: user.email,
        age: user.age,
        country: user.country,
        city: user.city,
        gender: user.gender,
        avatar: user.avatar,
        role: user.role
      }
    })

  } catch (error) {
    return res.status(500).json({ message: "Internal server error" })
  }
}




export async function verifyToken(req, res) {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        age: user.age,
        country: user.country,
        city: user.city,
        gender: user.gender,
        avatar: user.avatar,
        role: user.role
      }
    });
    
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

  export async function updateProfile(req, res) {
    try {
      const { email, age, country, city, gender } = req.body;

      const userId = req.user?.id;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updateData = {
        email,
        age,
        country,
        city,
        gender
      };

    
      if (req.file) {

        if (user.avatar) {

          const oldImagePath = path.join(
            __dirname,
            "..",
            user.avatar  
          );

          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

      
        updateData.avatar = `uploads/profile/${req.file.filename}`;
      }

      const updateUser = await User.findByIdAndUpdate(
        userId,
        updateData,
         { returnDocument: 'after' }
      ).select("-password");

      return res.status(200).json({
        message: "Profile updated successfully",
        user: updateUser
      });

    } catch (error) {
      return res.status(500).json({
        message: "Update failed",
        error: error.message
      });
    }
  }

export async function userLogout(req, res) {
  try {
    res.clearCookie("token")

    return res.status(200).json({ message: "User logout successfully" })

  } catch (error) {
    return res.status(500).json({ message: "User logout error", error: error.message });
  }
}


export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({ email })

    if (!user) return res.status(404).json({ message: "User not found" })
    if (user.isVerified) return res.status(400).json({ message: "User already verified" })

    if (!user.otp || !user.otpExpiresAt) {
      return res.status(400).json({ message: "No OTP found. Please request again." })
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please request new OTP." })
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" })
    }

    user.isVerified = true
    user.otp = undefined
    user.otpExpiresAt = undefined
    await user.save()

    res.status(200).json({ message: "Account verified successfully!" })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


export async function resendOtp(req, res) {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: "User not found" })
    if (user.isVerified) return res.status(400).json({ message: "User already verified" })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    user.otp = otp
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    await sendMail({
      to: user.email,
      subject: "R-fit OTP Verification",
      html: otpEmail(otp)
    })

    res.status(200).json({ message: "New OTP sent successfully" })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


export async function passwordResetOtp(req, res) {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: "User not found" })

    const otpPassword = Math.floor(100000 + Math.random() * 900000).toString()
    user.otpPassword = otpPassword
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    await sendMail({
      to: user.email,
      subject: "R-fit OTP Verification",
      html: passwordResetOtpEmail(otpPassword)
    })

    res.status(200).json({ message: "Password reset OTP sent successfully" })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


export async function passwordVerifyOtp(req, res) {
  try {
    const { email, otpPassword } = req.body

    const user = await User.findOne({ email })

    if (!user) return res.status(404).json({ message: "User not found" })

    if (!user.otpPassword || !user.otpExpiresAt) {
      return res.status(400).json({ message: "No OTP found. Please request again." })
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please request new OTP." })
    }

    if (user.otpPassword !== otpPassword) {
      return res.status(400).json({ message: "Invalid OTP" })
    }

    user.isVerified = true
    user.otpPassword = undefined
    user.otpExpiresAt = undefined
    await user.save()

    res.status(200).json({ message: "Otp verifed succssfully!" })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


export async function passwordReset(req, res) {
  try {
    const { email, password, confirmPassword } = req.body

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password didn't matched" })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }


    // if (!user.isVerified) {
    //   return res.status(400).json({ message: "Please verify OTP first" })
    // }

    const hashPassword = await bcrypt.hash(password, 12)

    user.password = hashPassword

   

    await user.save()

    return res.status(200).json({
      message: "Password reset successfully"
    })

  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}


export async function toggleNotification(req, res) {
  try {
    const userId = req.user.id

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.notification = !user.notification

    await user.save()

    return res.status(200).json({
      message: "Notification status updated",
      notification: user.notification
    })

  } catch (error) {
    return res.status(500).json({ message: error.message })
  }

}


export async function toggleMail(req, res) {
  try {
    const userId = req.user.id

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.mail = !user.mail

    await user.save()

    return res.status(200).json({
      message: "Mail status updated",
      mail: user.mail
    })

  } catch (error) {
    return res.status(500).json({ message: error.message })
  }

}


export async function toggleMeasurementUnit(req, res) {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("measurementUnit");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.measurementUnit =
      user.measurementUnit === "kg" ? "lb" : "kg";

    await user.save();

    return res.status(200).json({
      message: "Measurement unit updated",
      measurementUnit: user.measurementUnit
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}




export async function  fetchUsersForExplore(req, res){
  try {
    const loginUserId = req.user._id;

    const me = await User.findById(loginUserId)
      .select("followers following");

    if (!me) {
      return res.status(404).json({ message: "User not found" });
    }

    const excludeUsers = [
      loginUserId,
      ...me.followers,
      ...me.following
    ];

    const users = await User.find({
      _id: { $nin: excludeUsers }
    })
      .select("userName avatar country city gender");

    return res.status(200).json({
      users
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};