import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Import the new CSS Architecture
import './styles/main.css'; // <-- ADDED THIS LINE

// Components
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TestCases from './components/TestCases';
import Execution from './components/Execution';
import Reports from './components/Reports';
import Settings from './components/Settings';

// API
import api from './api';

function App() {
  // ... rest of your App.jsx code remains exactly the same ...
  // (I am not repeating the whole logic to save space, just keep the existing logic)
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const [loading, setLoading] = useState(true);
  const [testSuites, setTestSuites] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [testRuns, setTestRuns] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [settings, setSettings] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ... (Keep all your existing functions: fetchStatistics, handleCreateTestSuite, etc.) ...

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await api.getStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  }, []);

  const fetchTestSuites = useCallback(async () => {
    try {
      const response = await api.getTestSuites();
      if (response.success) {
        setTestSuites(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch test suites:', error);
      toast.error('Failed to load test suites');
    }
  }, []);

  const fetchTestCases = useCallback(async (suiteId = null) => {
    try {
      const response = await api.getTestCases(suiteId);
      if (response.success) {
        setTestCases(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch test cases:', error);
      toast.error('Failed to load test cases');
    }
  }, []);

  const fetchTestRuns = useCallback(async () => {
    try {
      const response = await api.getTestRuns();
      if (response.success) {
        setTestRuns(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch test runs:', error);
      toast.error('Failed to load test runs');
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.getSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTestSuites(),
        fetchTestCases(),
        fetchTestRuns(),
        fetchStatistics(),
        fetchSettings()
      ]);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      toast.error('Failed to load application data');
    } finally {
      setLoading(false);
    }
  }, [fetchTestSuites, fetchTestCases, fetchTestRuns, fetchStatistics, fetchSettings]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ============================================
  // TEST SUITE OPERATIONS
  // ============================================

  const handleCreateTestSuite = async (suiteData) => {
    try {
      const response = await api.createTestSuite(suiteData);
      if (response.success) {
        setTestSuites(prev => [...prev, response.data]);
        toast.success('Test suite created successfully');
        return response.data;
      }
    } catch (error) {
      toast.error('Failed to create test suite');
      throw error;
    }
  };

  const handleUpdateTestSuite = async (id, suiteData) => {
    try {
      const response = await api.updateTestSuite(id, suiteData);
      if (response.success) {
        setTestSuites(prev => prev.map(s => s.id === id ? response.data : s));
        toast.success('Test suite updated successfully');
        return response.data;
      }
    } catch (error) {
      toast.error('Failed to update test suite');
      throw error;
    }
  };

  const handleDeleteTestSuite = async (id) => {
    try {
      const response = await api.deleteTestSuite(id);
      if (response.success) {
        setTestSuites(prev => prev.filter(s => s.id !== id));
        setTestCases(prev => prev.filter(tc => tc.suiteId !== id));
        toast.success('Test suite deleted successfully');
        await fetchStatistics();
      }
    } catch (error) {
      toast.error('Failed to delete test suite');
      throw error;
    }
  };

  // ============================================
  // TEST CASE OPERATIONS
  // ============================================

  const handleCreateTestCase = async (testCaseData) => {
    try {
      const response = await api.createTestCase(testCaseData);
      if (response.success) {
        setTestCases(prev => [...prev, response.data]);
        await fetchStatistics();
        toast.success('Test case created successfully');
        return response.data;
      }
    } catch (error) {
      toast.error('Failed to create test case');
      throw error;
    }
  };

  const handleUpdateTestCase = async (id, testCaseData) => {
    try {
      const response = await api.updateTestCase(id, testCaseData);
      if (response.success) {
        setTestCases(prev => prev.map(tc => tc.id === id ? response.data : tc));
        toast.success('Test case updated successfully');
        return response.data;
      }
    } catch (error) {
      toast.error('Failed to update test case');
      throw error;
    }
  };

  const handleDeleteTestCase = async (id) => {
    try {
      const response = await api.deleteTestCase(id);
      if (response.success) {
        setTestCases(prev => prev.filter(tc => tc.id !== id));
        await fetchStatistics();
        toast.success('Test case deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete test case');
      throw error;
    }
  };

  // ============================================
  // CSV IMPORT
  // ============================================

  const handleCSVUpload = async (file, suiteName, suiteDescription) => {
    try {
      const response = await api.uploadCSV(file, suiteName, suiteDescription);
      if (response.success) {
        await fetchTestSuites();
        await fetchTestCases();
        await fetchStatistics();
        toast.success(response.message || 'CSV imported successfully');
        return response.data;
      }
    } catch (error) {
      toast.error('Failed to import CSV file');
      throw error;
    }
  };

  // ============================================
  // TEST RUN OPERATIONS
  // ============================================

  const handleCreateTestRun = async (runData) => {
    try {
      const response = await api.createTestRun(runData);
      if (response.success) {
        setTestRuns(prev => [...prev, response.data]);
        toast.success('Test run created successfully');
        return response.data;
      }
    } catch (error) {
      toast.error('Failed to create test run');
      throw error;
    }
  };

  const handleUpdateTestRun = async (id, runData) => {
    try {
      const response = await api.updateTestRun(id, runData);
      if (response.success) {
        setTestRuns(prev => prev.map(r => r.id === id ? response.data : r));
        await fetchStatistics();
        return response.data;
      }
    } catch (error) {
      toast.error('Failed to update test run');
      throw error;
    }
  };

  const handleDeleteTestRun = async (id) => {
    try {
      const response = await api.deleteTestRun(id);
      if (response.success) {
        setTestRuns(prev => prev.filter(r => r.id !== id));
        await fetchStatistics();
        toast.success('Test run deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete test run');
      throw error;
    }
  };

  // ============================================
  // EXECUTION RESULT OPERATIONS
  // ============================================

  const handleUpdateExecutionResult = async (id, resultData) => {
    try {
      const response = await api.updateExecutionResult(id, resultData);
      if (response.success) {
        await fetchTestRuns();
        await fetchStatistics();
        return response.data;
      }
    } catch (error) {
      toast.error('Failed to update execution result');
      throw error;
    }
  };

  // ============================================
  // SETTINGS OPERATIONS
  // ============================================

  const handleUpdateSettings = async (category, settingsData) => {
    try {
      const response = await api.updateSettings(category, settingsData);
      if (response.success) {
        setSettings(response.data);
        toast.success('Settings updated successfully');
        return response.data;
      }
    } catch (error) {
      toast.error('Failed to update settings');
      throw error;
    }
  };

  // ============================================
  // RENDER
  // ============================================

  // Loading state
  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-content">
          <div className="app-loading-logo">QA</div>
          <div className="app-loading-text">Loading QA Test Manager...</div>
          <div className="app-loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Navbar 
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <main className="main-content">
        <Routes>
          {/* Dashboard */}
          <Route 
            path="/" 
            element={
              <Dashboard 
                statistics={statistics}
                testSuites={testSuites}
                testRuns={testRuns}
                onRefresh={fetchAllData}
              />
            } 
          />
          
          {/* Test Cases Management */}
          <Route 
            path="/test-cases" 
            element={
              <TestCases 
                testSuites={testSuites}
                testCases={testCases}
                onCreateSuite={handleCreateTestSuite}
                onUpdateSuite={handleUpdateTestSuite}
                onDeleteSuite={handleDeleteTestSuite}
                onCreateTestCase={handleCreateTestCase}
                onUpdateTestCase={handleUpdateTestCase}
                onDeleteTestCase={handleDeleteTestCase}
                onUploadCSV={handleCSVUpload}
                onRefresh={fetchTestCases}
              />
            } 
          />
          
          {/* Test Execution */}
          <Route 
            path="/execution" 
            element={
              <Execution 
                testSuites={testSuites}
                testCases={testCases}
                testRuns={testRuns}
                settings={settings}
                onCreateTestRun={handleCreateTestRun}
                onUpdateTestRun={handleUpdateTestRun}
                onDeleteTestRun={handleDeleteTestRun}
                onUpdateExecutionResult={handleUpdateExecutionResult}
                onRefresh={fetchTestRuns}
              />
            } 
          />
          
          {/* Reports */}
          <Route 
            path="/reports" 
            element={
              <Reports 
                testRuns={testRuns}
                settings={settings}
                onRefresh={fetchTestRuns}
              />
            } 
          />
          
          {/* Settings */}
          <Route 
            path="/settings" 
            element={
              <Settings 
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            } 
          />
          
          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;