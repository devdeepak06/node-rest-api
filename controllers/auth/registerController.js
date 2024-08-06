import Joi from "joi";
import CustomErrorHandler from "../../services/CustomErrorHandler";
import { User } from "../../models";
import bcrypt from "bcrypt";
import JwtService from "../../services/JwtService";
const registerController = {
  async register(req, res, next) {
    const registerSchema = Joi.object({
      name: Joi.string().min(3).max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string()
        .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
        .required(),
      confirm_password: Joi.ref("password"),
    });
    console.log(req.body);
    const { error } = registerSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    // Check if user is in the database
    try {
      const exist = await User.exists({ email: req.body.email });
      if (exist) {
        return next(
          CustomErrorHandler.alreadyExist("This email is already taken")
        );
      }
      res.json({ message: "User registered successfully" });
    } catch (error) {
      return next(error);
    }

    // Hash Password
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    //Prepare the model
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });
    let access_token;
    try {
      const result = await user.save();
      console.log(result);
      // Token
      access_token = JwtService.sign({
        _id: result._id,
        role: result.role,
      });
    } catch (error) {
      return next(error);
    }
    res.json({ access_token: access_token });
  },
};

export default registerController;
