import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../../Slices/authSlice';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
    Building2,
    Layers,
    Home,
    Plus,
    Trash2,
    Save,
    CheckCircle,
    LayoutTemplate
} from 'lucide-react';
import '../../assets/css/Manager/managerSetup.css';

const API_BASE_URL = 'http://localhost:3000';

const ManagerSetup = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingStructure, setFetchingStructure] = useState(true);
    const [existingStructure, setExistingStructure] = useState(false);

    // Fetch existing structure on mount
    useEffect(() => {
        const fetchExistingStructure = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/manager/profile/api`, {
                    withCredentials: true
                });
                
                console.log('Profile API Response:', res.data);
                
                // Fetch community details separately to get blocks
                if (res.data.success) {
                    const communityRes = await axios.get(`${API_BASE_URL}/manager/currentcManager`, {
                        withCredentials: true
                    });
                    
                    console.log('Current Manager Response:', communityRes.data);
                    
                    if (communityRes.data?.assignedCommunity?.blocks?.length > 0) {
                        setBlocks(communityRes.data.assignedCommunity.blocks.map(b => ({
                            name: b.name,
                            totalFloors: b.totalFloors,
                            flatsPerFloor: b.flatsPerFloor
                        })));
                        setExistingStructure(true);
                    } else {
                        // No existing structure, start with default block
                        setBlocks([{ name: 'A', totalFloors: 5, flatsPerFloor: 4 }]);
                    }
                }
            } catch (err) {
                console.error('Error fetching structure:', err);
                // On error, start with default block
                setBlocks([{ name: 'A', totalFloors: 5, flatsPerFloor: 4 }]);
            } finally {
                setFetchingStructure(false);
            }
        };

        fetchExistingStructure();
    }, []);

    // Add a new block
    const handleAddBlock = () => {
        const nextChar = String.fromCharCode(65 + blocks.length); // A, B, C...
        setBlocks([...blocks, { name: nextChar, totalFloors: 5, flatsPerFloor: 4 }]);
    };

    // Remove a block
    const handleRemoveBlock = (index) => {
        const newBlocks = blocks.filter((_, i) => i !== index);
        setBlocks(newBlocks);
    };

    // Update block fields
    const handleBlockChange = (index, field, value) => {
        const newBlocks = [...blocks];
        newBlocks[index][field] = value;
        setBlocks(newBlocks);
    };

    // Stats calculation
    const totalBlocks = blocks.length;
    const totalFloors = blocks.reduce((acc, b) => acc + parseInt(b.totalFloors || 0), 0);
    const totalUnits = blocks.reduce((acc, b) => acc + (parseInt(b.totalFloors || 0) * parseInt(b.flatsPerFloor || 0)), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = blocks.map(b => ({
                name: b.name,
                totalFloors: parseInt(b.totalFloors),
                flatsPerFloor: parseInt(b.flatsPerFloor)
            }));

            const res = await axios.post(`${API_BASE_URL}/manager/setup-structure`, { blocks: payload }, {
                withCredentials: true,
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.data.success) {
                // Update Redux state to mark structure as complete
                dispatch(setUser({
                    ...user,
                    hasStructure: true
                }));
                
                toast.success(existingStructure ? 'Community structure updated successfully!' : 'Community structure created successfully!');
                
                // Navigate to dashboard
                setTimeout(() => {
                    navigate('/manager/dashboard', { replace: true });
                }, 1500);
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to save structure. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetchingStructure) {
        return (
            <div className="setup-container">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-secondary">Loading community structure...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="setup-container">
            {/* Header */}
            <div className="setup-header">
                <div>
                    <h2><LayoutTemplate className="text-primary" size={28} /> Community Structure {existingStructure ? 'Management' : 'Setup'}</h2>
                    <p>{existingStructure ? 'Update your community structure by modifying blocks, floors, and units.' : 'Define the physical layout of your community to generate resident units.'}</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue"><Building2 size={24} /></div>
                    <div className="stat-info">
                        <h3>Blocks</h3>
                        <div className="value">{totalBlocks}</div>
                    </div>
                </div>
                <div className="stat-card orange"><div className="stat-icon orange"><Layers size={24} /></div>
                    <div className="stat-info">
                        <h3>Total Floors</h3>
                        <div className="value">{totalFloors}</div>
                    </div>
                </div>
                <div className="stat-card green"><div className="stat-icon green"><Home size={24} /></div>
                    <div className="stat-info">
                        <h3>Total Units</h3>
                        <div className="value">{totalUnits}</div>
                    </div>
                </div>
            </div>

            {/* Blocks Configuration */}
            <div className="blocks-section">
                <div className="section-label">
                    <span>Block Configuration</span>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>Add blocks and define their height/width</span>
                </div>

                <div className="blocks-grid">
                    {blocks.map((block, index) => (
                        <div key={index} className="block-card">
                            <div className="block-header">
                                <h4>Block {index + 1}</h4>
                                {blocks.length > 1 && (
                                    <button className="remove-btn" onClick={() => handleRemoveBlock(index)}>
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="block-body">
                                <div className="input-group">
                                    <label>Block/Tower Name</label>
                                    <input
                                        type="text"
                                        value={block.name}
                                        onChange={(e) => handleBlockChange(index, 'name', e.target.value)}
                                        placeholder="e.g. A"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Total Floors</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={block.totalFloors}
                                        onChange={(e) => handleBlockChange(index, 'totalFloors', e.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Units per Floor</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={block.flatsPerFloor}
                                        onChange={(e) => handleBlockChange(index, 'flatsPerFloor', e.target.value)}
                                    />
                                </div>

                                <div className="block-summary-tag">
                                    Generating {block.totalFloors * block.flatsPerFloor} Units
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add Block Button Card */}
                    <div className="add-block-card" onClick={handleAddBlock}>
                        <div className="add-btn-icon"><Plus size={32} /></div>
                        <span>Add Another Block</span>
                    </div>
                </div>
            </div>

            {/* Floating Footer Action */}
            <div className="setup-footer">
                <div className="total-badge">
                    Total to generate: <span className="text-primary">{totalUnits} Units</span>
                </div>
                <button className="save-btn" onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                        <>Saving...</>
                    ) : (
                        <><CheckCircle size={18} /> {existingStructure ? 'Update Structure' : 'Save & Build Community'}</>
                    )}
                </button>
            </div>

        </div>
    );
};

export default ManagerSetup;
