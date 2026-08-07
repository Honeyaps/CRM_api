import { Response, NextFunction } from 'express';
import { Lead } from '../models';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

// Simple AI service - uses rule-based logic if no API key,
// or Anthropic Claude API if key is configured
const generateAIResponse = async (prompt: string, systemPrompt: string): Promise<string> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey && apiKey !== 'your_anthropic_api_key') {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 500,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      const textContent = data.content?.find((c: any) => c.type === 'text');
      return textContent?.text || 'AI response unavailable';
    } catch {
      // Fallback to rule-based
    }
  }

  // Rule-based fallback
  return fallbackAI(prompt, systemPrompt);
};

const fallbackAI = (prompt: string, type: string): string => {
  if (type.includes('summary')) {
    const words = prompt.toLowerCase();
    const products: string[] = [];
    if (words.includes('ivr')) products.push('IVR Solution');
    if (words.includes('cloud')) products.push('Cloud');
    if (words.includes('call')) products.push('Call Center');
    if (words.includes('sms')) products.push('SMS Service');

    const employeeMatch = prompt.match(/(\d+)\s*employees?/i);
    const employees = employeeMatch ? employeeMatch[1] : 'Unknown';

    return JSON.stringify({
      summary: `Customer inquiry for ${products.join(', ') || 'telecom services'}.`,
      products: products.length ? products : ['General Inquiry'],
      employeeCount: employees,
      priority: products.length > 1 ? 'High' : 'Medium',
    });
  }

  if (type.includes('email')) {
    return `Dear Customer,\n\nThank you for reaching out to us. We appreciate your interest in our services.\n\nWe would love to schedule a demo to show you how our solution can benefit your business.\n\nPlease let us know a convenient time for a call.\n\nBest regards,\nSales Team`;
  }

  return 'Follow up with the customer within 24 hours.';
};

export const generateSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { requirement, lead_id } = req.body;
    if (!requirement) throw new AppError('Requirement text is required', 400);

    const result = await generateAIResponse(
      requirement,
      'summary: You are a CRM assistant. Analyze the customer requirement and return a JSON with: summary (1-2 lines), products (array), employeeCount (string), priority (Low/Medium/High/Urgent). Return only valid JSON.'
    );

    // Save to lead if lead_id provided
    if (lead_id) {
      await Lead.update({ ai_summary: result }, { where: { id: lead_id } });
    }

    let parsed;
    try { parsed = JSON.parse(result); } catch { parsed = { summary: result }; }

    res.json({ success: true, message: 'Summary generated', data: parsed });
  } catch (err) {
    next(err);
  }
};

export const generateEmailDraft = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { customer_name, company, requirement, context } = req.body;

    const prompt = `Draft a professional email reply to ${customer_name} from ${company || 'their company'}. 
Their requirement: ${requirement || 'General inquiry'}. 
Context: ${context || 'Initial follow-up'}. 
Keep it concise, professional, and action-oriented.`;

    const result = await generateAIResponse(prompt, 'email: You are a professional sales email writer for a telecom/IT company.');

    res.json({ success: true, message: 'Email draft generated', data: { draft: result } });
  } catch (err) {
    next(err);
  }
};

export const generateTaskSuggestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message, lead_name } = req.body;

    const prompt = `Customer message: "${message}". Suggest a follow-up task with title, description, and suggested time.`;
    const result = await generateAIResponse(prompt, 'task: You are a CRM task assistant. Return a JSON with: title, description, suggestedDate, suggestedTime. Return only valid JSON.');

    let parsed;
    try { parsed = JSON.parse(result); } catch {
      parsed = {
        title: `Follow up with ${lead_name || 'customer'}`,
        description: message,
        suggestedDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        suggestedTime: '10:00',
      };
    }

    res.json({ success: true, message: 'Task suggestion generated', data: parsed });
  } catch (err) {
    next(err);
  }
};
