export type ClientStatus = 'Lead' | 'Prospect' | 'Active' | 'Paused' | 'Completed' | 'Lost'
export type ProjectStatus = 'Planning' | 'Production' | 'Editing' | 'Review' | 'Revision' | 'Delivered' | 'Completed' | 'Paused'
export type LeadStatus = 'New' | 'Qualified' | 'Contacted' | 'Replied' | 'Interested' | 'Call' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost'
export type InvoiceStatus = 'Draft' | 'Sent' | 'Pending' | 'Paid' | 'Overdue' | 'Cancelled'
export type TaskStatus = 'Todo' | 'In Progress' | 'Completed' | 'Cancelled'
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
export type TaskCategory = 'Client' | 'Project' | 'Lead' | 'Outreach' | 'UGC' | 'Fiverr' | 'Upwork' | 'Admin'
export type OutreachStatus = 'Active' | 'Paused' | 'Completed'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  company_name: string | null
  monthly_revenue_target: number
  monthly_outreach_target: number
  weekly_lead_target: number
  monthly_client_target: number
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  website: string | null
  instagram: string | null
  youtube: string | null
  linkedin: string | null
  country: string | null
  service: string | null
  status: ClientStatus
  start_date: string | null
  monthly_value: number
  project_value: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  client_id: string | null
  name: string
  service: string | null
  start_date: string | null
  deadline: string | null
  status: ProjectStatus
  revenue: number
  cost: number
  priority: 'Low' | 'Medium' | 'High'
  notes: string | null
  created_at: string
  updated_at: string
  client?: Client
}

export interface Deliverable {
  id: string
  project_id: string
  user_id: string
  title: string
  status: 'Pending' | 'In Progress' | 'Completed'
  due_date: string | null
  notes: string | null
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  category: TaskCategory
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  client_id: string | null
  project_id: string | null
  lead_id: string | null
  assigned_user: string | null
  created_at: string
  updated_at: string
  client?: Client
  project?: Project
}

export interface Lead {
  id: string
  user_id: string
  name: string
  company: string | null
  email: string | null
  website: string | null
  instagram: string | null
  youtube: string | null
  linkedin: string | null
  niche: string | null
  country: string | null
  source: string | null
  potential_value: number
  status: LeadStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Outreach {
  id: string
  user_id: string
  lead_id: string
  campaign_id: string | null
  first_contact: string | null
  last_contact: string | null
  next_followup: string | null
  attempts: number
  status: string
  notes: string | null
  created_at: string
  updated_at: string
  lead?: Lead
}

export interface OutreachCampaign {
  id: string
  user_id: string
  name: string
  description: string | null
  status: OutreachStatus
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  user_id: string
  invoice_number: string
  client_id: string | null
  project_id: string | null
  amount: number
  currency: string
  issue_date: string
  due_date: string | null
  status: InvoiceStatus
  payment_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  client?: Client
  project?: Project
}

export interface Payment {
  id: string
  user_id: string
  client_id: string | null
  project_id: string | null
  invoice_id: string | null
  amount: number
  currency: string
  payment_date: string
  method: string | null
  category: string
  notes: string | null
  created_at: string
  client?: Client
}

export interface Expense {
  id: string
  user_id: string
  category: string
  description: string
  amount: number
  currency: string
  date: string
  notes: string | null
  created_at: string
}

export interface UGCShoot {
  id: string
  user_id: string
  client_id: string | null
  shoot_date: string | null
  studio: string | null
  models: string | null
  videos_planned: number
  videos_shot: number
  videos_edited: number
  delivery_deadline: string | null
  revenue: number
  studio_cost: number
  model_cost: number
  editing_cost: number
  other_costs: number
  notes: string | null
  status: string
  created_at: string
  updated_at: string
  client?: Client
}

export interface FiverrGig {
  id: string
  user_id: string
  title: string
  category: string | null
  status: string
  orders_completed: number
  revenue: number
  rating: number | null
  created_at: string
  updated_at: string
}

export interface UpworkProfile {
  id: string
  user_id: string
  proposals_sent: number
  replies: number
  interviews: number
  hires: number
  revenue: number
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string | null
  entity_name: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface DashboardStats {
  revenueThisMonth: number
  profitThisMonth: number
  outstandingPayments: number
  activeClients: number
  activeProjects: number
  openLeads: number
  pipelineValue: number
  expensesThisMonth: number
}
