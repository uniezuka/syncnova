import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { BadRequestError, UnauthorizedError } from "../../middleware/errors";
import { userRepository } from "../users/user.repository";

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "7d";

function toPublicUser(user: { id: string; email: string; name: string }) {
  return { id: user.id, email: user.email, name: user.name };
}

function signToken(user: { id: string; email: string; name: string }) {
  return jwt.sign(toPublicUser(user), env.jwtSecret, { expiresIn: TOKEN_EXPIRY });
}

export const authService = {
  async register(email: string, password: string, name: string) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new BadRequestError("An account with this email already exists");
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.create({ email, name, passwordHash });
    return { user: toPublicUser(user), token: signToken(user) };
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }
    return { user: toPublicUser(user), token: signToken(user) };
  },
};
