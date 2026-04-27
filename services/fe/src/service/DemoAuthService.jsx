const DEMO_USERS_STORAGE_KEY = 'demoAuthUsers';

const readUsers = () => {
    try {
        const raw = localStorage.getItem(DEMO_USERS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const saveUsers = (users) => {
    localStorage.setItem(DEMO_USERS_STORAGE_KEY, JSON.stringify(users));
};

const createVerificationCode = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
};

const findUserById = (users, userId) => {
    return users.find((user) => String(user.id) === String(userId));
};

const register = ({firstName, lastName, email, password}) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const users = readUsers();
    const exists = users.some((user) => String(user.email || '').toLowerCase() === normalizedEmail);

    if (exists) {
        return {
            success: false,
            message: 'Bu e-posta ile daha önce kayıt oluşturulmuş.'
        };
    }

    const createdUser = {
        id: `demo-user-${Date.now()}`,
        name: String(firstName || '').trim(),
        surname: String(lastName || '').trim(),
        email: normalizedEmail,
        password: String(password || ''),
        emailVerified: false,
        verificationCode: createVerificationCode(),
        createdAt: new Date().toISOString()
    };

    users.push(createdUser);
    saveUsers(users);

    return {
        success: true,
        user: {
            id: createdUser.id,
            name: createdUser.name,
            surname: createdUser.surname,
            email: createdUser.email
        },
        verificationCode: createdUser.verificationCode
    };
};

const login = (email, password) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const rawPassword = String(password || '');
    const users = readUsers();

    const matchedUser = users.find((user) => {
        return String(user.email || '').toLowerCase() === normalizedEmail && String(user.password || '') === rawPassword;
    });

    if (!matchedUser) {
        throw new Error('Kullanıcı adı veya şifre hatalı');
    }

    if (!matchedUser.emailVerified) {
        throw new Error('E-posta adresinizi doğrulamadan giriş yapamazsınız.');
    }

    return {
        token: `demo-token-${matchedUser.id}-${Date.now()}`,
        user: {
            id: matchedUser.id,
            name: matchedUser.name,
            surname: matchedUser.surname,
            email: matchedUser.email
        }
    };
};

const lookupAccountStatus = (email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const users = readUsers();
    const matchedUser = users.find((user) => String(user.email || '').toLowerCase() === normalizedEmail);

    return {
        email: normalizedEmail,
        exists: !!matchedUser,
        emailVerified: !!matchedUser && !!matchedUser.emailVerified
    };
};

const getVerificationDetails = (userId) => {
    const users = readUsers();
    const matchedUser = findUserById(users, userId);

    if (!matchedUser) {
        return null;
    }

    return {
        userId: matchedUser.id,
        email: matchedUser.email,
        verificationCode: matchedUser.verificationCode,
        emailVerified: !!matchedUser.emailVerified
    };
};

const confirm = (userId, confirmCode) => {
    const users = readUsers();
    const matchedUser = findUserById(users, userId);

    if (!matchedUser) {
        return {
            success: false,
            message: 'Onay için kullanıcı bulunamadı.'
        };
    }

    if (String(matchedUser.verificationCode || '').trim() !== String(confirmCode || '').trim()) {
        return {
            success: false,
            message: 'Doğrulama kodu geçersiz. Demo kodu kullanarak tekrar deneyin.'
        };
    }

    matchedUser.emailVerified = true;
    saveUsers(users);

    return {
        success: true,
        message: 'Demo hesap doğrulandı. Giriş yapabilirsiniz.'
    };
};

const createConfirm = (userId) => {
    const users = readUsers();
    const matchedUser = findUserById(users, userId);

    if (!matchedUser) {
        return {
            success: false,
            message: 'Doğrulama kodu tekrar oluşturulamadı.'
        };
    }

    matchedUser.verificationCode = createVerificationCode();
    matchedUser.emailVerified = false;
    saveUsers(users);

    return {
        success: true,
        message: 'Demo doğrulama kodu yenilendi.',
        verificationCode: matchedUser.verificationCode
    };
};

export default {
    register,
    login,
    lookupAccountStatus,
    getVerificationDetails,
    confirm,
    createConfirm
};
