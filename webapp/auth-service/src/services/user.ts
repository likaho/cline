import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../services/database';
import { config } from '../config';
import { generateToken, verifyToken } from '../utils/jwt';
import { storeSession, deleteSession } from '../services/redis';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  organizationId?: string;
  roles: string[];
  provider?: string;
  providerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  plan: 'free' | 'team' | 'enterprise';
  settings: object;
  createdAt: Date;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const db = getDb();
  
  // Check if user exists
  const existing = await db<User>('users').where({ email: input.email }).first();
  if (existing) {
    throw new Error('User already exists');
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);
  
  // Create user
  const userId = uuidv4();
  const now = new Date();
  
  await db<User>('users').insert({
    id: userId,
    email: input.email,
    name: input.name,
    passwordHash,
    roles: ['user'],
    createdAt: now,
    updatedAt: now,
  });
  
  // Generate tokens
  const accessToken = generateToken({
    userId,
    roles: ['user'],
  });
  
  const refreshToken = uuidv4();
  
  // Store session
  await storeSession(refreshToken, { userId }, 7 * 24 * 60 * 60); // 7 days
  
  const user = await db<User>('users').where({ id: userId }).first();
  
  return {
    user: {
      ...user!,
      passwordHash: undefined,
    },
    accessToken,
    refreshToken,
  };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const db = getDb();
  
  const user = await db<User>('users').where({ email: input.email }).first();
  if (!user || !user.passwordHash) {
    throw new Error('Invalid credentials');
  }
  
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }
  
  // Generate tokens
  const accessToken = generateToken({
    userId: user.id,
    organizationId: user.organizationId,
    roles: user.roles,
  });
  
  const refreshToken = uuidv4();
  
  // Store session
  await storeSession(refreshToken, {
    userId: user.id,
    organizationId: user.organizationId,
  }, 7 * 24 * 60 * 60);
  
  return {
    user: {
      ...user,
      passwordHash: undefined,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  const session = await getSession(refreshToken);
  if (!session) {
    throw new Error('Invalid refresh token');
  }
  
  const db = getDb();
  const user = await db<User>('users').where({ id: (session as { userId: string }).userId }).first();
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const accessToken = generateToken({
    userId: user.id,
    organizationId: user.organizationId,
    roles: user.roles,
  });
  
  return {
    user: {
      ...user,
      passwordHash: undefined,
    },
    accessToken,
    refreshToken,
  };
}

export async function logout(refreshToken: string): Promise<void> {
  await deleteSession(refreshToken);
}

export async function getUserById(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
  const db = getDb();
  const user = await db<User>('users').where({ id: userId }).first();
  
  if (!user) {
    return null;
  }
  
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<Omit<User, 'passwordHash'>> {
  const db = getDb();
  
  await db<User>('users')
    .where({ id: userId })
    .update({
      ...updates,
      updatedAt: new Date(),
    });
  
  const user = await db<User>('users').where({ id: userId }).first();
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Organization functions
export async function createOrganization(name: string, ownerId: string): Promise<Organization> {
  const db = getDb();
  const orgId = uuidv4();
  const now = new Date();
  
  await db<Organization>('organizations').insert({
    id: orgId,
    name,
    plan: 'team',
    settings: {},
    createdAt: now,
  });
  
  // Add owner to organization
  await db<User>('users')
    .where({ id: ownerId })
    .update({
      organizationId: orgId,
      roles: ['owner'],
    });
  
  return db<Organization>('organizations').where({ id: orgId }).first() as Promise<Organization>;
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const db = getDb();
  return db<Organization>('organizations').where({ id: orgId }).first() || null;
}
