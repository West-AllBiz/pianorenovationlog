import { act, cleanup, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({getSession:vi.fn(),getUser:vi.fn(),onAuthStateChange:vi.fn(),signOut:vi.fn(),signInWithPassword:vi.fn(),signUp:vi.fn(),from:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{auth:mocks,from:mocks.from}}));
vi.mock('@/auth/emailConfig',()=>({AUTH_MODE:'review'}));
import { AuthProvider,useAuth } from './useAuth';
let latest:ReturnType<typeof useAuth>;
let event:(_event:string,session:Session|null)=>void;
const legacyUser={id:'synthetic-legacy-user',email:'fixture.staff@piano.local',is_anonymous:false,email_confirmed_at:null};
const legacySession={user:legacyUser,access_token:'synthetic-session'} as unknown as Session;
function Harness(){latest=useAuth();return <span>{latest.user?.id??'none'}:{latest.role}</span>;}
const mount=()=>render(<QueryClientProvider client={new QueryClient()}><AuthProvider><Harness/></AuthProvider></QueryClientProvider>);
beforeEach(()=>{vi.clearAllMocks();mocks.getSession.mockResolvedValue({data:{session:null},error:null});mocks.getUser.mockResolvedValue({data:{user:legacyUser},error:null});mocks.onAuthStateChange.mockImplementation(cb=>{event=cb;return{data:{subscription:{unsubscribe:vi.fn()}}};});mocks.signInWithPassword.mockResolvedValue({error:null});mocks.signUp.mockResolvedValue({error:null});mocks.from.mockImplementation(table=>({select:()=>({eq:()=>({single:async()=>({data:table==='profiles'?{full_name:'Fixture Staff',email:legacyUser.email}:{role:'viewer'},error:null})})})}));vi.stubGlobal('fetch',vi.fn(()=>{throw Error('Live network forbidden');}));});
afterEach(cleanup);
it('review mode accepts an existing legacy identity with authoritative readable profile/role',async()=>{mount();act(()=>event('SIGNED_IN',legacySession));await waitFor(()=>expect(latest.user?.id).toBe(legacyUser.id));expect(latest.loading).toBe(false);expect(latest.role).toBe('viewer');expect(latest.authError).toBeNull();expect(mocks.getUser).toHaveBeenCalledWith('synthetic-session');});
it('review mode preserves legacy hook methods without enabling a new email-flow signup fallback',async()=>{mount();await act(async()=>{await latest.signIn(legacyUser.email,'synthetic-only');await latest.signUp(legacyUser.email,'synthetic-only','Fixture Staff');});expect(mocks.signInWithPassword).toHaveBeenCalledTimes(1);expect(mocks.signUp).toHaveBeenCalledTimes(1);expect(fetch).not.toHaveBeenCalled();});
it('review mode still fails closed if the current legacy role/profile cannot be verified',async()=>{mocks.from.mockImplementation(()=>({select:()=>({eq:()=>({single:async()=>({data:null,error:Error('PRIVATE')})})})}));mount();act(()=>event('SIGNED_IN',legacySession));await waitFor(()=>expect(latest.authError).not.toBeNull());expect(latest.user).toBeNull();expect(latest.isAdmin).toBe(false);expect(latest.authError).not.toContain('PRIVATE');});
