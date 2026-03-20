import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Groups } from './pages/Groups';
import { CreateGroup } from './pages/CreateGroup';
import { GroupDetail } from './pages/GroupDetail';
import { AddExpense } from './pages/AddExpense';
import { Activity } from './pages/Activity';
import { Settings } from './pages/Settings';
import { JoinGroup } from './pages/JoinGroup';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/new" element={<CreateGroup />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/groups/:id/expense" element={<AddExpense />} />
          <Route path="/groups/:id/expense/:expenseId" element={<AddExpense />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/join" element={<JoinGroup />} />
          <Route path="/join/:code" element={<JoinGroup />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
