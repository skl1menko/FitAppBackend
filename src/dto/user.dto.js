class UserDTO{

    static toList(user){
        return {
            userId: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role_name,
            avatarUrl: user.image_url
        }
    }

    static toProfile(user){
        return{
            userId: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role_name,
            avatarUrl: user.image_url,
            created_at: user.created_at
        }
    }

    static toAuth(user,token){
        return{
            userId: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role_name,
            avatarUrl: user.image_url,
            token: token
        }
    }

    static toListArray(users){
        return users.map(user => this.toList(user));
    }
}

module.exports = UserDTO;
