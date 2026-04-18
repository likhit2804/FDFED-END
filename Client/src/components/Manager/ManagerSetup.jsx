import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Building2, CheckCircle, Home, Layers, Plus, Trash2 } from "lucide-react";

import { Loader } from "../Loader";
import { StatCard } from "../shared";
import {
  ManagerActionButton,
  ManagerPageShell,
  ManagerRecordCard,
  ManagerRecordGrid,
  ManagerSection,
} from "./ui";

const API_BASE_URL = "";

const createBlock = (name) => ({
  name,
  totalFloors: 5,
  flatsPerFloor: 4,
});

const getNextBlockName = (index) => String.fromCharCode(65 + index);

const ManagerSetup = () => {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([createBlock("A")]);
  const [loading, setLoading] = useState(false);
  const [fetchingStructure, setFetchingStructure] = useState(true);
  const [editingBlockIndex, setEditingBlockIndex] = useState(null);

  useEffect(() => {
    const fetchStructure = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/manager/get-structure`, {
          withCredentials: true,
        });

        if (res.data.success && Array.isArray(res.data.blocks) && res.data.blocks.length > 0) {
          setBlocks(res.data.blocks);
        }
      } catch (err) {
        console.error("Error fetching structure:", err);
      } finally {
        setFetchingStructure(false);
      }
    };

    fetchStructure();
  }, []);

  const totals = useMemo(() => {
    const totalBlocks = blocks.length;
    const totalFloors = blocks.reduce((acc, block) => acc + Number(block.totalFloors || 0), 0);
    const totalUnits = blocks.reduce(
      (acc, block) => acc + Number(block.totalFloors || 0) * Number(block.flatsPerFloor || 0),
      0
    );
    return { totalBlocks, totalFloors, totalUnits };
  }, [blocks]);

  const handleAddBlock = () => {
    const nextIndex = blocks.length;
    setBlocks((current) => [...current, createBlock(getNextBlockName(current.length))]);
    setEditingBlockIndex(nextIndex);
  };

  const handleRemoveBlock = (index) => {
    setBlocks((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setEditingBlockIndex((current) => {
      if (current === null) return null;
      if (current === index) return null;
      if (current > index) return current - 1;
      return current;
    });
  };

  const handleBlockChange = (index, field, value) => {
    const nextValue =
      field === "name"
        ? value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12)
        : value;
    setBlocks((current) =>
      current.map((block, currentIndex) =>
        currentIndex === index ? { ...block, [field]: nextValue } : block
      )
    );
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const seen = new Set();
      const payload = blocks.map((block, index) => {
        const name = String(block.name || "").trim().toUpperCase();
        const totalFloors = Number.parseInt(block.totalFloors, 10);
        const flatsPerFloor = Number.parseInt(block.flatsPerFloor, 10);

        if (!name) {
          throw new Error(`Block ${index + 1}: name is required`);
        }
        if (seen.has(name)) {
          throw new Error(`Duplicate block name: ${name}`);
        }
        if (!Number.isInteger(totalFloors) || totalFloors < 1 || totalFloors > 120) {
          throw new Error(`Block ${name}: total floors must be between 1 and 120`);
        }
        if (!Number.isInteger(flatsPerFloor) || flatsPerFloor < 1 || flatsPerFloor > 200) {
          throw new Error(`Block ${name}: units per floor must be between 1 and 200`);
        }

        seen.add(name);
        return { name, totalFloors, flatsPerFloor };
      });

      const res = await axios.post(
        `${API_BASE_URL}/manager/setup-structure`,
        { blocks: payload },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.data.success) {
        navigate("/manager/dashboard", { replace: true });
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Setup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ManagerPageShell
      eyebrow="Community Setup"
      title="Configure the physical structure of your community."
      description="Define towers, floors, and units here so registration, resident mapping, and occupancy tools follow the real building layout."
      chips={[`${totals.totalBlocks} blocks`, `${totals.totalUnits} units planned`]}
    >
      <div className="ue-stat-grid">
        <StatCard label="Blocks" value={totals.totalBlocks} icon={<Building2 size={22} />} iconColor="var(--brand-500)" iconBg="var(--info-soft)" />
        <StatCard label="Total Floors" value={totals.totalFloors} icon={<Layers size={22} />} iconColor="var(--warning-700)" iconBg="var(--warning-soft)" />
        <StatCard label="Total Units" value={totals.totalUnits} icon={<Home size={22} />} iconColor="var(--success-500)" iconBg="var(--success-soft)" />
      </div>

      <ManagerSection
        eyebrow="Structure Builder"
        title="Block configuration"
        description="Adjust the unit generation rules for each block before saving the structure."
        actions={
          <>
            <ManagerActionButton variant="secondary" onClick={handleAddBlock}>
              <Plus size={16} />
              Add Another Block
            </ManagerActionButton>
            <ManagerActionButton variant="primary" onClick={handleSubmit} disabled={loading || fetchingStructure}>
              <CheckCircle size={16} />
              {loading ? "Saving..." : "Save & Build"}
            </ManagerActionButton>
          </>
        }
      >
        {fetchingStructure ? (
          <div className="manager-ui-empty"><Loader label="Loading structure..." /></div>
        ) : (
          <ManagerRecordGrid>
            {blocks.map((block, index) => {
              const unitCount = Number(block.totalFloors || 0) * Number(block.flatsPerFloor || 0);
              const isEditing = editingBlockIndex === index;

              return (
                <ManagerRecordCard
                  key={`${block.name}-${index}`}
                  title={`Block ${index + 1}`}
                  subtitle={block.name ? `${block.name} tower` : "Name this block"}
                  status={<span className="manager-ui-status-pill">{unitCount} units</span>}
                  meta={[
                    { label: "Floors", value: block.totalFloors || 0 },
                    { label: "Units / Floor", value: block.flatsPerFloor || 0 },
                    { label: "Generated", value: unitCount || 0 },
                  ]}
                  footer={
                    isEditing ? (
                      <div className="manager-ui-stack">
                        <div>
                          <label className="form-label">Block Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={block.name}
                            onChange={(event) => handleBlockChange(index, "name", event.target.value)}
                            placeholder="e.g. A"
                          />
                        </div>
                        <div className="manager-ui-split-metrics">
                          <div>
                            <label className="form-label">Total Floors</label>
                            <input
                              type="number"
                              min="1"
                              className="form-control"
                              value={block.totalFloors}
                              onChange={(event) => handleBlockChange(index, "totalFloors", event.target.value)}
                            />
                          </div>
                          <div>
                            <label className="form-label">Units per Floor</label>
                            <input
                              type="number"
                              min="1"
                              className="form-control"
                              value={block.flatsPerFloor}
                              onChange={(event) => handleBlockChange(index, "flatsPerFloor", event.target.value)}
                            />
                          </div>
                        </div>
                        <p className="manager-ui-note">This block will generate {unitCount || 0} units.</p>
                      </div>
                    ) : (
                      <p className="manager-ui-note">Click Edit to update block name, floors, and unit count.</p>
                    )
                  }
                  actions={
                    <>
                      <ManagerActionButton
                        variant={isEditing ? "primary" : "secondary"}
                        onClick={() => setEditingBlockIndex((current) => (current === index ? null : index))}
                      >
                        {isEditing ? "Done" : "Edit"}
                      </ManagerActionButton>
                      {blocks.length > 1 ? (
                        <ManagerActionButton variant="danger" onClick={() => handleRemoveBlock(index)}>
                          <Trash2 size={16} />
                          Remove
                        </ManagerActionButton>
                      ) : null}
                    </>
                  }
                />
              );
            })}
          </ManagerRecordGrid>
        )}
      </ManagerSection>
    </ManagerPageShell>
  );
};

export default ManagerSetup;

