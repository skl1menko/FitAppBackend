/**
 * Middleware для перевірки ролі користувача
 * Використовується ПІСЛЯ authMiddleware
 * @param {string|array} allowedRoles - дозволені ролі ('trainer' або ['trainer', 'athlete'])
 */

const requireRole = (allowedRoles) => {
    return (req, res, next) =>{
        try{
            if(!req.user){
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            if(!roles.includes(req.user.role)){
                return res.status(403).json({
                    success: false,
                    message: `Access forbidden: Need appropriate role: ${roles.join(' or ')}`,
                    userRole: req.user.role
                });
            }

            next();
        } catch(err){
            return res.status(500).json({
                success: false,
                message: 'Role verification failed',
                error: err.message
            });
        }
    };
};
const requireTrainer = requireRole('trainer');
const requireAthlete = requireRole('athlete');


module.exports = {
    requireRole,
    requireTrainer,
    requireAthlete
};