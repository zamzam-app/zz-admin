import users from './users.json';

export interface User {
  name: string;
  email: string;
  role: string;
  outletId?: string[];
}

export const mockLogin = async (payload: { email: string; password: string }): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = users.find((u) => u.email === payload.email && u.password === payload.password);

      if (user) {
        resolve({
          name: user.name,
          email: user.email,
          role: user.role,
          outletId: user.outletId,
        });
      } else {
        reject(new Error('Invalid email or password'));
      }
    }, 1000);
  });
};
