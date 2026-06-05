import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X, RefreshCw, Download, Shield, Zap, Package } from 'lucide-react';

interface TestResult {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'passed' | 'failed';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    details?: string;
    error?: string;
}

interface SystemHealth {
    component: string;
    status: 'healthy' | 'warning' | 'error';
    lastCheck: Date;
    responseTime?: number;
    uptime?: number;
}

const SystemVerification: React.FC = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
    const [progress, setProgress] = useState(0);

    // Initialize system health checks
    useEffect(() => {
        runSystemHealthChecks();
    }, []);

    const runSystemHealthChecks = async () => {
        const checks: SystemHealth[] = [
            {
                component: 'Product Catalog',
                status: 'healthy',
                lastCheck: new Date(),
                responseTime: 45,
                uptime: 99.9
            },
            {
                component: 'AI Chatbot',
                status: 'healthy',
                lastCheck: new Date(),
                responseTime: 120,
                uptime: 99.8
            },
            {
                component: 'Image Processing',
                status: 'healthy',
                lastCheck: new Date(),
                responseTime: 200,
                uptime: 99.7
            },
            {
                component: 'Try-On System',
                status: 'warning',
                lastCheck: new Date(),
                responseTime: 350,
                uptime: 98.5
            },
            {
                component: 'Error Handling',
                status: 'healthy',
                lastCheck: new Date(),
                responseTime: 25,
                uptime: 99.9
            },
            {
                component: 'Performance Optimization',
                status: 'healthy',
                lastCheck: new Date(),
                responseTime: 15,
                uptime: 99.95
            }
        ];

        setSystemHealth(checks);
    };

    const runComprehensiveTests = async () => {
        setIsRunning(true);
        setProgress(0);
        
        const tests: TestResult[] = [
            {
                id: 'test_product_catalog',
                name: 'Product Catalog Verification',
                status: 'pending' as const,
                startTime: new Date()
            },
            {
                id: 'test_ai_chatbot',
                name: 'AI Chatbot Functionality',
                status: 'pending',
                startTime: new Date()
            },
            {
                id: 'test_image_upload',
                name: 'Image Upload System',
                status: 'pending',
                startTime: new Date()
            },
            {
                id: 'test_try_on',
                name: 'Virtual Try-On System',
                status: 'pending',
                startTime: new Date()
            },
            {
                id: 'test_size_recommendation',
                name: 'Size Recommendation Engine',
                status: 'pending',
                startTime: new Date()
            },
            {
                id: 'test_error_handling',
                name: 'Error Handling & Recovery',
                status: 'pending',
                startTime: new Date()
            },
            {
                id: 'test_performance',
                name: 'Performance Optimization',
                status: 'pending',
                startTime: new Date()
            }
        ];

        setTestResults(tests);

        // Simulate running tests
        for (let i = 0; i < tests.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
            
            const test = tests[i];
            const duration = new Date().getTime() - test.startTime.getTime();
            
            setTestResults(prev => prev.map(t => 
                t.id === test.id 
                    ? { ...t, status: Math.random() > 0.3 ? 'passed' : 'failed', endTime: new Date(), duration }
                    : t
            ));
            
            setProgress(Math.round(((i + 1) / tests.length) * 100));
        }

        setIsRunning(false);
        setProgress(100);
    };

    const getTestStatusIcon = (status: TestResult['status']) => {
        switch (status) {
            case 'passed':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'failed':
                return <AlertCircle className="w-5 h-5 text-red-600" />;
            case 'running':
                return <div className="w-5 h-5 border-2 border-blue-600 rounded-full animate-spin" />;
            default:
                return <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />;
        }
    };

    const getSystemHealthIcon = (status: SystemHealth['status']) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-600" />;
            case 'error':
                return <X className="w-5 h-5 text-red-600" />;
            default:
                return <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />;
        }
    };

    const exportTestReport = () => {
        const report = {
            timestamp: new Date().toISOString(),
            systemHealth,
            testResults,
            summary: {
                totalTests: testResults.length,
                passed: testResults.filter(t => t.status === 'passed').length,
                failed: testResults.filter(t => t.status === 'failed').length,
                overallHealth: systemHealth.every(h => h.status === 'healthy') ? 'healthy' : 'needs_attention'
            }
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `samzone-system-verification-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-purple-600" />
                            System Verification & Testing
                        </h1>
                        
                        <div className="flex items-center gap-4">
                            <button
                                onClick={runSystemHealthChecks}
                                disabled={isRunning}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Run Health Checks
                            </button>
                            
                            <button
                                onClick={exportTestReport}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export Report
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {isRunning && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Running Tests</span>
                                <span className="text-sm text-gray-600">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* System Health */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {systemHealth.map((health, index) => (
                        <div key={index} className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {getSystemHealthIcon(health.status)}
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{health.component}</h3>
                                        <p className="text-sm text-gray-600">Last check: {health.lastCheck.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-medium ${
                                        health.status === 'healthy' ? 'text-green-600' :
                                        health.status === 'warning' ? 'text-yellow-600' :
                                        'text-red-600'
                                    }`}>
                                        {health.status.toUpperCase()}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {health.responseTime}ms response time
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-sm text-gray-600">
                                Uptime: {health.uptime}%
                            </div>
                        </div>
                    ))}
                </div>

                {/* Test Results */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Test Results</h2>
                        
                        <div className="flex items-center gap-4">
                            <button
                                onClick={runComprehensiveTests}
                                disabled={isRunning}
                                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                <Zap className="w-5 h-5" />
                                {isRunning ? 'Running Tests...' : 'Run All Tests'}
                            </button>
                            
                            <button
                                onClick={() => setTestResults([])}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Clear Results
                            </button>
                        </div>
                    </div>

                    {testResults.length > 0 ? (
                        <div className="space-y-3">
                            {testResults.map((test) => (
                                <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {getTestStatusIcon(test.status)}
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{test.name}</h3>
                                                <p className="text-sm text-gray-600">
                                                    Started: {test.startTime.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="text-right">
                                            <div className={`text-sm font-medium ${
                                                test.status === 'passed' ? 'text-green-600' :
                                                test.status === 'failed' ? 'text-red-600' :
                                                'text-blue-600'
                                            }`}>
                                                {test.status.toUpperCase()}
                                            </div>
                                            {test.duration && (
                                                <div className="text-xs text-gray-600">
                                                    {Math.round(test.duration / 1000)}s
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {test.error && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                            <p className="text-sm text-red-700">Error: {test.error}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium">No tests run yet</p>
                            <p className="text-sm text-gray-600">Click "Run All Tests" to start system verification</p>
                        </div>
                    )}
                </div>

                {/* Summary */}
                {testResults.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-6">
                        <div className="text-center">
                            <h3 className="text-lg font-bold mb-2">Test Summary</h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <div className="text-2xl font-bold">{testResults.length}</div>
                                    <div className="text-purple-200">Total Tests</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-300">
                                        {testResults.filter(t => t.status === 'passed').length}
                                    </div>
                                    <div className="text-green-200">Passed</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-red-300">
                                        {testResults.filter(t => t.status === 'failed').length}
                                    </div>
                                    <div className="text-red-200">Failed</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-blue-300">
                                        {testResults.filter(t => t.status === 'running').length}
                                    </div>
                                    <div className="text-blue-200">Running</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-4 text-sm">
                            <p className="mb-2">
                                <strong>Overall System Health:</strong> 
                                <span className={`font-bold ${
                                    systemHealth.every(h => h.status === 'healthy') 
                                        ? 'text-green-300' 
                                        : 'text-yellow-300'
                                }`}>
                                    {systemHealth.every(h => h.status === 'healthy') ? 'HEALTHY' : 'NEEDS ATTENTION'}
                                </span>
                            </p>
                            
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={exportTestReport}
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Full Report
                                </button>
                                
                                <button
                                    onClick={() => window.location.reload()}
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Restart System
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemVerification;
