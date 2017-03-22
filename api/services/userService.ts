import { Connection } from 'typeorm';
import { User } from "../models/user";
import { ConnectionManager } from "./connectionManager";
import { Message } from "../common/message";
import { ResObject } from "../models/ResObject";
import { ValidateUtil } from "../utils/validateUtil";

export class UserService {
    static async checkUser(email: string, pwd: string): Promise<ResObject> {
        const user = await UserService.getUserByEmail(email);
        if (user && user.password === pwd) {//TODO: md5
            return { success: true, message: '', result: user };
        }
        return { success: false, message: Message.userCheckFailed };
    }

    static async createUser(name: string, email: string, pwd: string): Promise<ResObject> {
        let checkRst = ValidateUtil.checkEmail(email);
        checkRst.success && (checkRst = ValidateUtil.checkPassword(pwd));
        checkRst.success && (checkRst = ValidateUtil.checkUserName(name));
        if (!checkRst.success) {
            return checkRst;
        }

        const isEmailExist = await UserService.IsUserEmailExist(email);
        if (isEmailExist) {
            return { success: false, message: Message.userEmailRepeat };
        }

        const user = new User(name, email, pwd);
        user.save();

        return { success: true, message: Message.userCreateSuccess };
    }

    static async IsUserEmailExist(email: string): Promise<boolean> {
        const user = await UserService.getUserByEmail(email);

        return user !== undefined;
    }

    static async getUserByEmail(email: string, needTeam?: boolean, needEnv?: boolean): Promise<User> {
        const connection = await ConnectionManager.getInstance();

        let rep = await connection.getRepository(User)
            .createQueryBuilder("user")
            .where(`user.email = :email`)
            .setParameter('email', email);

        needTeam && (rep = rep.innerJoinAndSelect('user.teams', 'team'));
        needEnv && (rep = rep.innerJoinAndSelect('user.environments', 'env'));

        return rep.getOne();
    }

    static async getUserById(id: string, needTeam?: boolean, needEnv?: boolean): Promise<User> {
        const connection = await ConnectionManager.getInstance();

        let rep = await connection.getRepository(User)
            .createQueryBuilder("user")
            .where(`user.id = :id`)
            .setParameter('id', id);

        needTeam && (rep = rep.innerJoinAndSelect('user.teams', 'team'));
        needEnv && (rep = rep.innerJoinAndSelect('user.environments', 'env'));

        return rep.getOne();
    }
}