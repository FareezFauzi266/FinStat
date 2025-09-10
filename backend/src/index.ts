import express from 'express';
require('dotenv').config();
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { registerUser, loginUser } from './services/auth';
import { authenticateToken, AuthenticatedRequest } from './middleware/auth';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Authentication endpoints
const RegisterSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  password: z.string().min(6),
  confirmPassword: z.string().min(6)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6)
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    
    const { email, fullName, password } = parsed.data;
    const result = await registerUser({ email, fullName, password });
    
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    
    const result = await loginUser(parsed.data);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' });
  }
});

app.put('/api/auth/change-password', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = ChangePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    
    const { currentPassword, newPassword } = parsed.data;
    const userId = req.user!.userId;
    
    // Get user from database
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to change password' });
  }
});

// Bank Accounts endpoints
const BankAccountSchema = z.object({
  name: z.string().min(1),
  accountNumber: z.string().min(1)
});

app.get('/api/bank-accounts', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bankAccounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bank accounts' });
  }
});

app.post('/api/bank-accounts', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = BankAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    
    const { name, accountNumber } = parsed.data;
    const userId = req.user!.userId;
    
    const bankAccount = await prisma.bankAccount.create({
      data: {
        name,
        accountNumber,
        userId
      }
    });
    
    res.status(201).json(bankAccount);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create bank account' });
  }
});

app.delete('/api/bank-accounts/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user!.userId;
    
    // Check if bank account belongs to user
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { id, userId }
    });
    
    if (!bankAccount) {
      return res.status(404).json({ error: 'Bank account not found' });
    }
    
    await prisma.bankAccount.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete bank account' });
  }
});

// Category Management endpoints
const CategorySchema = z.object({
  name: z.string().min(1)
});

const SubcategorySchema = z.object({
  name: z.string().min(1),
  categoryId: z.number().int()
});

app.get('/api/categories', authenticateToken, async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({ 
      include: { subcategories: true },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const parsed = CategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    
    const { name } = parsed.data;
    
    const category = await prisma.category.create({
      data: { name }
    });
    
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      res.status(400).json({ error: 'Category with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    // Check if category exists
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Delete category (this will cascade delete subcategories due to foreign key constraints)
    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

app.get('/api/subcategories', authenticateToken, async (req, res) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const where = categoryId ? { categoryId } : {};
    const subs = await prisma.subcategory.findMany({ 
      where,
      orderBy: { name: 'asc' }
    });
    res.json(subs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
});

app.post('/api/subcategories', authenticateToken, async (req, res) => {
  try {
    const parsed = SubcategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    
    const { name, categoryId } = parsed.data;
    
    // Check if category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const subcategory = await prisma.subcategory.create({
      data: { name, categoryId }
    });
    
    res.status(201).json(subcategory);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      res.status(400).json({ error: 'Subcategory with this name already exists in this category' });
    } else {
      res.status(500).json({ error: 'Failed to create subcategory' });
    }
  }
});

app.delete('/api/subcategories/:id', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    // Check if subcategory exists
    const subcategory = await prisma.subcategory.findUnique({ where: { id } });
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    await prisma.subcategory.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subcategory' });
  }
});

// Transaction endpoints
app.get('/api/transactions', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const txs = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    include: { category: true, subcategory: true }
  });
  const withTotal = txs.map(t => ({ ...t, total: Number(t.debit) - Number(t.credit) }));
  res.json(withTotal);
});

const TransactionSchema = z.object({
  account: z.string().min(1),
  date: z.string(),
  name: z.string().min(1),
  debit: z.number().nonnegative(),
  credit: z.number().nonnegative(),
  categoryId: z.number().int().optional(),
  subcategoryId: z.number().int().optional(),
  type: z.enum(['Income', 'Expense']),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

app.post('/api/transactions', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const parsed = TransactionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  
  const data = parsed.data;
  const userId = req.user!.userId;
  
  const created = await prisma.transaction.create({ 
    data: {
      account: data.account,
      date: new Date(data.date),
      name: data.name,
      debit: data.debit,
      credit: data.credit,
      categoryId: data.categoryId ?? null,
      subcategoryId: data.subcategoryId ?? null,
      type: data.type,
      location: data.location ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      userId
    }
  });
  res.status(201).json(created);
});

app.put('/api/transactions/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const userId = req.user!.userId;
  
  const parsed = TransactionSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  
  const data = parsed.data;
  
  // Check if transaction belongs to user
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId }
  });
  
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  
  const updated = await prisma.transaction.update({ 
    where: { id }, 
    data: {
      account: data.account,
      date: data.date ? new Date(data.date) : undefined,
      name: data.name,
      debit: data.debit,
      credit: data.credit,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      type: data.type,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude
    }
  });
  res.json(updated);
});

app.delete('/api/transactions/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const userId = req.user!.userId;
  
  // Check if transaction belongs to user
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId }
  });
  
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  
  await prisma.transaction.delete({ where: { id } });
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
