
-- Timestamp updater function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- USER ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'contributor', 'viewer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.can_edit(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'contributor'))
$$;

CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name) VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'contributor');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PIANOS
CREATE TABLE public.pianos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id TEXT NOT NULL UNIQUE,
  tag TEXT,
  color_tag TEXT,
  brand TEXT NOT NULL,
  model TEXT DEFAULT '',
  serial_number TEXT DEFAULT '',
  piano_type TEXT NOT NULL DEFAULT 'upright',
  finish TEXT DEFAULT '',
  bench_included BOOLEAN DEFAULT false,
  year_built TEXT DEFAULT '',
  year_estimated BOOLEAN DEFAULT true,
  country_of_origin TEXT DEFAULT '',
  ownership_category TEXT NOT NULL DEFAULT 'business_inventory',
  source TEXT DEFAULT 'other',
  purchase_date DATE,
  purchase_price NUMERIC(10,2),
  pickup_date DATE,
  pickup_location TEXT DEFAULT '',
  transport_company TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'acquired',
  asking_price NUMERIC(10,2),
  sold_price NUMERIC(10,2),
  sold_date DATE,
  buyer_name TEXT,
  buyer_contact TEXT,
  tags TEXT[] DEFAULT '{}',
  private_notes TEXT DEFAULT '',
  percent_complete INTEGER DEFAULT 0,
  friction_score INTEGER,
  roi_health TEXT DEFAULT 'moderate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pianos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read pianos" ON public.pianos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert pianos" ON public.pianos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Update pianos" ON public.pianos FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "Delete pianos" ON public.pianos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_pianos_updated_at BEFORE UPDATE ON public.pianos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CONDITION INSPECTIONS
CREATE TABLE public.condition_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piano_id UUID NOT NULL REFERENCES public.pianos(id) ON DELETE CASCADE,
  initial_assessment TEXT DEFAULT '',
  soundboard INTEGER DEFAULT 3, bridges INTEGER DEFAULT 3, pinblock INTEGER DEFAULT 3,
  strings INTEGER DEFAULT 3, tuning_pins INTEGER DEFAULT 3, action INTEGER DEFAULT 3,
  hammers INTEGER DEFAULT 3, dampers INTEGER DEFAULT 3, keytops INTEGER DEFAULT 3,
  pedals INTEGER DEFAULT 3, trapwork INTEGER DEFAULT 3, cabinet INTEGER DEFAULT 3, casters INTEGER DEFAULT 3,
  recommended_work TEXT DEFAULT '', priority_level TEXT DEFAULT 'medium',
  soundboard_cracks BOOLEAN DEFAULT false, bridge_separation BOOLEAN DEFAULT false,
  loose_tuning_pins BOOLEAN DEFAULT false, rust BOOLEAN DEFAULT false,
  water_damage BOOLEAN DEFAULT false, action_wear BOOLEAN DEFAULT false,
  loose_joints BOOLEAN DEFAULT false, pedal_problems BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.condition_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read inspections" ON public.condition_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert inspections" ON public.condition_inspections FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Update inspections" ON public.condition_inspections FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "Delete inspections" ON public.condition_inspections FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON public.condition_inspections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RESTORATION TASKS
CREATE TABLE public.restoration_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piano_id UUID NOT NULL REFERENCES public.pianos(id) ON DELETE CASCADE,
  title TEXT NOT NULL, category TEXT DEFAULT 'other', description TEXT DEFAULT '',
  assignee TEXT, status TEXT NOT NULL DEFAULT 'todo',
  labor_hours NUMERIC(6,2) DEFAULT 0, parts_used TEXT DEFAULT '', notes TEXT DEFAULT '',
  due_date DATE, completion_date DATE, created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.restoration_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read tasks" ON public.restoration_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert tasks" ON public.restoration_tasks FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Update tasks" ON public.restoration_tasks FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "Admin delete tasks" ON public.restoration_tasks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.restoration_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EXPENSES
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piano_id UUID NOT NULL REFERENCES public.pianos(id) ON DELETE CASCADE,
  purchase_price NUMERIC(10,2) DEFAULT 0, moving_cost NUMERIC(10,2) DEFAULT 0,
  parts_cost NUMERIC(10,2) DEFAULT 0, labor_hours NUMERIC(6,2) DEFAULT 0,
  labor_cost NUMERIC(10,2) DEFAULT 0, marketing_cost NUMERIC(10,2) DEFAULT 0,
  estimated_sale_price NUMERIC(10,2), actual_sale_price NUMERIC(10,2), notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Update expenses" ON public.expenses FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CLIENT RECORDS
CREATE TABLE public.client_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piano_id UUID NOT NULL REFERENCES public.pianos(id) ON DELETE CASCADE UNIQUE,
  client_name TEXT NOT NULL, client_contact TEXT DEFAULT '',
  estimate NUMERIC(10,2), deposit_received NUMERIC(10,2) DEFAULT 0,
  work_authorized BOOLEAN DEFAULT false, labor_hours NUMERIC(6,2) DEFAULT 0,
  parts_used TEXT DEFAULT '', invoice_total NUMERIC(10,2), balance_due NUMERIC(10,2) DEFAULT 0,
  pickup_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read clients" ON public.client_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert clients" ON public.client_records FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Update clients" ON public.client_records FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE TRIGGER update_client_records_updated_at BEFORE UPDATE ON public.client_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DONATION RECORDS
CREATE TABLE public.donation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piano_id UUID NOT NULL REFERENCES public.pianos(id) ON DELETE CASCADE UNIQUE,
  donation_recipient TEXT DEFAULT '', donation_status TEXT DEFAULT 'pending',
  donation_value NUMERIC(10,2), delivery_date DATE, notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.donation_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read donations" ON public.donation_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert donations" ON public.donation_records FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Update donations" ON public.donation_records FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE TRIGGER update_donation_records_updated_at BEFORE UPDATE ON public.donation_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CHARACTER NOTES
CREATE TABLE public.character_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piano_id UUID NOT NULL REFERENCES public.pianos(id) ON DELETE CASCADE UNIQUE,
  tonal_character TEXT[] DEFAULT '{}', action_feel TEXT[] DEFAULT '{}',
  musical_suitability TEXT[] DEFAULT '{}', cabinet_character TEXT[] DEFAULT '{}',
  custom_shop_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.character_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read character notes" ON public.character_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert character notes" ON public.character_notes FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Update character notes" ON public.character_notes FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE TRIGGER update_character_notes_updated_at BEFORE UPDATE ON public.character_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PERFORMANCE PROFILES
CREATE TABLE public.performance_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piano_id UUID NOT NULL REFERENCES public.pianos(id) ON DELETE CASCADE UNIQUE,
  pitch_level TEXT DEFAULT '', last_tuning_date DATE,
  pitch_raise_required BOOLEAN DEFAULT false, regulation_status TEXT DEFAULT '',
  voicing_status TEXT DEFAULT '', humidity_sensitivity TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.performance_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read perf profiles" ON public.performance_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert perf profiles" ON public.performance_profiles FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Update perf profiles" ON public.performance_profiles FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE TRIGGER update_performance_profiles_updated_at BEFORE UPDATE ON public.performance_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ACTIVITY LOG
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piano_id UUID REFERENCES public.pianos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT DEFAULT '',
  action_description TEXT NOT NULL,
  changed_field TEXT, old_value TEXT, new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read activity log" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert activity log" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Admin delete activity" ON public.activity_log FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- INDEXES
CREATE INDEX idx_pianos_status ON public.pianos(status);
CREATE INDEX idx_pianos_ownership ON public.pianos(ownership_category);
CREATE INDEX idx_tasks_piano_id ON public.restoration_tasks(piano_id);
CREATE INDEX idx_expenses_piano_id ON public.expenses(piano_id);
CREATE INDEX idx_activity_piano_id ON public.activity_log(piano_id);
CREATE INDEX idx_activity_created ON public.activity_log(created_at DESC);
