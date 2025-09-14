import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const DatabaseTest = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Check if user is authenticated
      addResult(`User authenticated: ${user ? 'Yes' : 'No'}`);
      if (!user) {
        addResult('ERROR: No user found');
        return;
      }

      // Test 2: Check if folders table exists
      addResult('Testing folders table...');
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('count')
        .limit(1);

      if (foldersError) {
        addResult(`ERROR: Folders table issue - ${foldersError.message}`);
        addResult(`Error code: ${foldersError.code}`);
        addResult(`Error details: ${JSON.stringify(foldersError)}`);
      } else {
        addResult('SUCCESS: Folders table exists and is accessible');
      }

      // Test 3: Try to insert a test folder
      addResult('Testing folder creation...');
      const { data: insertData, error: insertError } = await supabase
        .from('folders')
        .insert({
          user_id: user.id,
          subject_id: '00000000-0000-0000-0000-000000000000', // Dummy subject ID
          name: `Test Folder ${Date.now()}`
        })
        .select()
        .single();

      if (insertError) {
        addResult(`ERROR: Folder creation failed - ${insertError.message}`);
        addResult(`Error code: ${insertError.code}`);
      } else {
        addResult('SUCCESS: Test folder created successfully');
        addResult(`Created folder ID: ${insertData.id}`);
        
        // Clean up test folder
        await supabase
          .from('folders')
          .delete()
          .eq('id', insertData.id);
        addResult('Test folder cleaned up');
      }

      // Test 4: Check study_materials table structure
      addResult('Testing study_materials table...');
      const { data: materialsData, error: materialsError } = await supabase
        .from('study_materials')
        .select('id, folder_id')
        .limit(1);

      if (materialsError) {
        addResult(`ERROR: Study materials table issue - ${materialsError.message}`);
      } else {
        addResult('SUCCESS: Study materials table accessible');
        addResult('folder_id column exists in study_materials');
      }

    } catch (error) {
      addResult(`FATAL ERROR: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Database Connection Test</h3>
      
      <button
        onClick={testDatabaseConnection}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test Database Connection'}
      </button>

      <div className="mt-4">
        <h4 className="font-medium mb-2">Test Results:</h4>
        <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500">Click the button above to run tests</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className={`text-sm ${result.includes('ERROR') ? 'text-red-600' : result.includes('SUCCESS') ? 'text-green-600' : 'text-gray-700'}`}>
                {result}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
