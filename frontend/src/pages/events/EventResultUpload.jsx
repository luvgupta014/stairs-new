import React, { useState, useEffect } from 'react';
import { uploadEventResults, getEventResultFiles, deleteEventResultFile, downloadIndividualEventResultFile, downloadSampleResultSheet, getEventLeaderboard, issueCertificates, issueWinnerCertificates } from '../../api';
import { 
  FaUpload, 
  FaFileExcel, 
  FaTimes, 
  FaDownload, 
  FaTrash, 
  FaEye, 
  FaCalendarAlt, 
  FaTrophy,
  FaFilter,
  FaSearch,
  FaMedal,
  FaAward
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import BackButton from '../../components/BackButton';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGateNotice from '../../components/PermissionGateNotice';

const EventResultUpload = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [eventData, setEventData] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [forbidden, setForbidden] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState('');
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    loadEventFiles();
  }, [eventId]);

  const loadEventFiles = async () => {
    try {
      setLoading(true);
      setForbidden(false);
      const response = await getEventResultFiles(eventId);
      
      if (response.success) {
        setEventData(response.data.event);
        setFiles(response.data.files || []);
        await loadLeaderboardSilent();
      }
    } catch (error) {
      console.error('Failed to load event files:', error);
      const status = error?.statusCode || error?.status || error?.response?.status;
      if ((status === 401 || status === 403) && user?.role === 'EVENT_INCHARGE') {
        setForbidden(true);
      } else {
        showMessage('error', 'Failed to load event files');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboardSilent = async () => {
    try {
      setLeaderboardLoading(true);
      setLeaderboardError('');
      const res = await getEventLeaderboard(eventId);
      if (res?.success) {
        setLeaderboard(res.data?.leaderboard || []);
      } else {
        setLeaderboard([]);
      }
    } catch (e) {
      // If leaderboard is not available yet (no results uploaded), keep it quiet.
      setLeaderboard([]);
      const msg = e?.message || e?.userMessage || '';
      if (msg && !String(msg).toLowerCase().includes('not found')) {
        setLeaderboardError(msg);
      } else {
        setLeaderboardError('');
      }
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const newFiles = Array.from(event.target.files);
    const excelFiles = newFiles.filter(file => {
      const extension = file.name.toLowerCase();
      return extension.endsWith('.xlsx') || extension.endsWith('.xls') || extension.endsWith('.csv');
    });

    if (excelFiles.length !== newFiles.length) {
      showMessage('warning', 'Only Excel files (.xlsx, .xls) and CSV files are allowed');
    }

    setSelectedFiles(prev => [...prev, ...excelFiles]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      showMessage('error', 'Please select at least one file to upload');
      return;
    }

    try {
      setUploading(true);
      
      const uploadFormData = new FormData();
      selectedFiles.forEach(file => {
        uploadFormData.append('files', file);
      });
      
      if (description) {
        uploadFormData.append('description', description);
      }

      const response = await uploadEventResults(eventId, uploadFormData);
      
      if (response.success) {
        showMessage('success', `Successfully uploaded ${response.data.uploadedFiles.length} file(s)`);
        setSelectedFiles([]);
        setDescription('');
        await loadEventFiles(); // Reload the file list + leaderboard
        await loadLeaderboardSilent();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      showMessage('error', error.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const topHolders = (() => {
    const list = Array.isArray(leaderboard) ? leaderboard : [];
    const withPlacement = list.filter(r => r?.placement !== null && r?.placement !== undefined);
    withPlacement.sort((a, b) => (a.placement ?? 999) - (b.placement ?? 999));
    return withPlacement.slice(0, 10);
  })();

  const issueWinnerForRow = async (row) => {
    try {
      if (!row?.studentId || !row?.placement) {
        showMessage('error', 'Missing studentId/placement for this row.');
        return;
      }
      setIssuing(true);
      const payload = {
        eventId,
        selectedStudentsWithPositions: [{
          studentId: row.studentId,
          position: row.placement,
          positionText: row.placementText || (row.placement === 1 ? 'Winner' : row.placement === 2 ? 'Runner-Up' : `Position ${row.placement}`)
        }]
      };
      const res = await issueWinnerCertificates(payload);
      if (res?.success) showMessage('success', 'Winner certificate issued.');
      else showMessage('error', res?.message || 'Failed to issue winner certificate.');
    } catch (e) {
      showMessage('error', e?.message || 'Failed to issue winner certificate.');
    } finally {
      setIssuing(false);
    }
  };

  const issueAllWinnerCertificates = async () => {
    try {
      const winners = topHolders.filter(r => r?.studentId && r?.placement);
      if (!winners.length) {
        showMessage('warning', 'No position holders found to issue winner certificates.');
        return;
      }
      if (!confirm(`Issue winner certificates to ${winners.length} position holder(s)?`)) return;
      setIssuing(true);
      const payload = {
        eventId,
        selectedStudentsWithPositions: winners.map(r => ({
          studentId: r.studentId,
          position: r.placement,
          positionText: r.placementText || (r.placement === 1 ? 'Winner' : r.placement === 2 ? 'Runner-Up' : `Position ${r.placement}`)
        }))
      };
      const res = await issueWinnerCertificates(payload);
      if (res?.success) showMessage('success', `Issued ${res.data?.issued || winners.length} winner certificate(s).`);
      else showMessage('error', res?.message || 'Failed to issue winner certificates.');
    } catch (e) {
      showMessage('error', e?.message || 'Failed to issue winner certificates.');
    } finally {
      setIssuing(false);
    }
  };

  const issueAllParticipationCertificates = async () => {
    try {
      const all = (Array.isArray(leaderboard) ? leaderboard : []).filter(r => r?.studentId).map(r => r.studentId);
      const uniq = Array.from(new Set(all));
      if (!uniq.length) {
        showMessage('warning', 'No students found to issue participation certificates.');
        return;
      }
      if (!confirm(`Issue participation certificates to ALL ${uniq.length} student(s)?`)) return;
      setIssuing(true);
      const res = await issueCertificates({ eventId, selectedStudents: uniq });
      if (res?.success) showMessage('success', `Issued ${res.data?.issued || uniq.length} participation certificate(s).`);
      else showMessage('error', res?.message || 'Failed to issue participation certificates.');
    } catch (e) {
      showMessage('error', e?.message || 'Failed to issue participation certificates.');
    } finally {
      setIssuing(false);
    }
  };

  const handleDelete = async (fileId, filename) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      const response = await deleteEventResultFile(eventId, fileId);
      
      if (response.success) {
        showMessage('success', 'File deleted successfully');
        loadEventFiles();
      }
    } catch (error) {
      console.error('Delete failed:', error);
      showMessage('error', error.message || 'Failed to delete file');
    }
  };

  const handleDownload = async (fileId, originalName) => {
    try {
      const response = await downloadIndividualEventResultFile(eventId, fileId);
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`📥 Downloaded: ${originalName}`);
      showMessage('success', `Downloaded ${originalName}`);
    } catch (error) {
      console.error('Download failed:', error);
      showMessage('error', error.message || 'Failed to download file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <PermissionGateNotice
        title="Result upload access required"
        description="This page is available only when you have Result Upload permission for this event."
        requiredLabel="Result Upload"
        eventLink={`/events/${eventId}`}
        secondaryAction={{
          label: 'Email Support',
          href: 'mailto:info@stairs.org.in?subject=Permission%20Request%20-%20Result%20Upload'
        }}
        primaryAction={{
          label: 'Back to My Events',
          onClick: () => navigate('/dashboard/event_incharge'),
          className: 'bg-indigo-600 hover:bg-indigo-700'
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-4">
                <BackButton 
                  to={user?.role === 'EVENT_INCHARGE' ? '/dashboard/event_incharge' : '/dashboard/coach'} 
                  label="Back to Dashboard" 
                  variant="minimal"
                  className="text-white hover:text-green-200"
                />
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2">Event Result Files</h1>
                <p className="text-green-100 text-lg">
                  {eventData ? `Upload and manage result files for: ${eventData.name}` : 'Upload and manage your event result files'}
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-white">
              <FaFileExcel className="text-2xl" />
              <span className="text-lg font-medium">Results Management</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-yellow-50 border border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center">
              <span className="flex-1">{message.text}</span>
              <button 
                onClick={() => setMessage({ type: '', text: '' })}
                className="ml-2 text-current opacity-70 hover:opacity-100"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FaUpload className="mr-2 text-green-600" />
              Upload Event Result Files
            </h2>
            <button
              type="button"
              onClick={async () => {
                try {
                  await downloadSampleResultSheet(eventId, false);
                  showMessage('success', 'Sample sheet downloaded successfully');
                } catch (error) {
                  showMessage('error', 'Failed to download sample sheet: ' + (error.message || 'Unknown error'));
                }
              }}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <FaFileExcel className="mr-2" />
              Download Sample Sheet
            </button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">📋 File Format Requirements</h4>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li><strong>Required columns to fill:</strong> placement, points</li>
              <li><strong>Stable identifier (do not edit):</strong> studentUID</li>
              <li><strong>Placement examples:</strong> 1, 2, 3... OR "Winner", "Runner-Up", "Top 8"</li>
              <li><strong>File types:</strong> Excel (.xlsx, .xls) or CSV</li>
              <li><strong>Note:</strong> Download the sample sheet above to see the exact format with example data</li>
            </ul>
          </div>
          
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for these result files"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel/CSV Files (Maximum 10 files, 10MB each)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaFileExcel className="mr-2" />
                  Choose Result Files
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Drag and drop files here or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Accepted formats: .xlsx, .xls, .csv
                </p>
              </div>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Selected Files ({selectedFiles.length})
                </h3>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex items-center">
                        <FaFileExcel className="text-green-600 mr-2" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading || selectedFiles.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload className="mr-2" />
                    Upload Files
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Leaderboard Preview (after upload) */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FaTrophy className="mr-2 text-amber-600" />
              Leaderboard (Preview)
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadLeaderboardSilent}
                disabled={leaderboardLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
              >
                {leaderboardLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                type="button"
                onClick={issueAllWinnerCertificates}
                disabled={issuing || !topHolders.length}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                title={!topHolders.length ? 'Upload results first to get position holders' : ''}
              >
                <FaMedal className="mr-2" />
                Issue Winner Certificates
              </button>
              <button
                type="button"
                onClick={issueAllParticipationCertificates}
                disabled={issuing || !(leaderboard?.length)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                title={!leaderboard?.length ? 'Upload results first to load leaderboard' : ''}
              >
                <FaAward className="mr-2" />
                Issue Participation (All)
              </button>
            </div>
          </div>

          {leaderboardError ? (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              {leaderboardError}
            </div>
          ) : null}

          {!leaderboardLoading && (!leaderboard || leaderboard.length === 0) ? (
            <div className="text-sm text-gray-600">
              No leaderboard data yet. Upload the filled template (placement + points) and refresh.
            </div>
          ) : (
            <>
              {/* Top holders cards */}
              {topHolders.length ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {topHolders.slice(0, 3).map((r, idx) => (
                    <div key={`${r.studentId}-${idx}`} className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-amber-700">
                            {r.placementText || `Position ${r.placement || (idx + 1)}`}
                          </div>
                          <div className="text-lg font-bold text-gray-900 truncate">{r.name || '—'}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            UID: <span className="font-mono">{r.studentUID || '—'}</span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Points: <span className="font-semibold">{r.points ?? '—'}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => issueWinnerForRow(r)}
                          disabled={issuing || !r.studentId || !r.placement}
                          className="shrink-0 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-50"
                        >
                          Issue
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Leaderboard table */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Position</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Student</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Points</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">IDs</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(leaderboard || []).slice(0, 200).map((r, i) => (
                      <tr key={`${r.studentId}-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                            {r.placementText || (r.placement ? `#${r.placement}` : '—')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">{r.name || '—'}</div>
                          <div className="text-xs text-gray-600">
                            UID: <span className="font-mono">{r.studentUID || '—'}</span>
                            {r.alias ? <span className="ml-2">• Alias: <span className="font-semibold">{r.alias}</span></span> : null}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{r.selectedCategory || '—'}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-semibold">{r.points ?? '—'}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          <div className="text-xs">{r.email || '—'}</div>
                          <div className="text-xs">{r.phone || '—'}</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          <div className="text-xs">PSN: <span className="font-mono">{r.playstationId || '—'}</span></div>
                          <div className="text-xs">EA: <span className="font-mono">{r.eaId || '—'}</span></div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => issueWinnerForRow(r)}
                            disabled={issuing || !r.studentId || !r.placement}
                            className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-50"
                            title={!r.placement ? 'Placement not set for this row' : ''}
                          >
                            Issue Winner Cert
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {leaderboard?.length > 200 ? (
                  <div className="mt-3 text-xs text-gray-500">
                    Showing first 200 rows (for performance). Export full results from the template if needed.
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>

        {/* Files List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FaFileExcel className="mr-2 text-green-600" />
              Uploaded Result Files ({files.length})
            </h2>
          </div>

          {files.length === 0 ? (
            <div className="text-center py-12">
              <FaFileExcel className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Result Files Yet</h3>
              <p className="text-gray-600">
                Upload your first result file to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {files.map((file) => (
                <div key={file.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <FaFileExcel className="text-green-600 mr-3 text-lg" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {file.originalName}
                          </h3>
                          {file.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {file.description}
                            </p>
                          )}
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Size: {formatFileSize(file.size)}</span>
                            <span>Uploaded: {formatDate(file.uploadedAt)}</span>
                            {file.coach?.name && (
                              <span>By: {file.coach.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownload(file.id, file.originalName)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors inline-flex items-center"
                      >
                        <FaDownload className="mr-1" />
                        Download
                      </button>
                      
                      <button
                        onClick={() => handleDelete(file.id, file.originalName)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors inline-flex items-center"
                      >
                        <FaTrash className="mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventResultUpload;