import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface FrictionOption {
  label: string;
  value: number;
  desc: string;
}

interface FrictionFactor {
  label: string;
  options: FrictionOption[];
}

const FRICTION_FACTORS: Record<string, FrictionFactor> = {
  distance: {
    label: "Distance from Saint Cloud",
    options: [
      { label: "< 15 miles", value: 0, desc: "Local pickup" },
      { label: "15–35 miles", value: 1, desc: "Easy run" },
      { label: "35–60 miles", value: 2, desc: "Moderate drive" },
      { label: "60–100 miles", value: 4, desc: "Half-day trip" },
      { label: "100+ miles", value: 7, desc: "Full day, strategic only" },
    ],
  },
  stairs: {
    label: "Loading / Access",
    options: [
      { label: "Ground floor, clear", value: 0, desc: "Best case" },
      { label: "Minor obstacles", value: 1, desc: "Minor maneuvering" },
      { label: "1 flight of stairs", value: 3, desc: "Requires 3+ people or equipment" },
      { label: "2+ flights / elevator", value: 5, desc: "High complexity" },
      { label: "Unknown / not disclosed", value: 2, desc: "Assume moderate" },
    ],
  },
  strings: {
    label: "String Condition",
    options: [
      { label: "Intact, light rust", value: 0, desc: "Workable" },
      { label: "Moderate rust, playable", value: 2, desc: "May affect tone" },
      { label: "Heavy corrosion", value: 4, desc: "Friction multiplier" },
      { label: "Multiple breaks", value: 5, desc: "Parts & labor scope risk" },
      { label: "Full restring likely", value: 8, desc: "Diamond-only justification" },
    ],
  },
  hammers: {
    label: "Hammer Condition",
    options: [
      { label: "Light wear, reshapeable", value: 0, desc: "Low friction" },
      { label: "Moderate grooves", value: 1, desc: "Manageable" },
      { label: "Deep grooves, voicing needed", value: 3, desc: "Hours required" },
      { label: "Major felt failure", value: 5, desc: "Replacement likely" },
      { label: "Full replacement needed", value: 7, desc: "Significant cost & labor" },
    ],
  },
  pinblock: {
    label: "Pinblock / Tuning Pins",
    options: [
      { label: "Solid, pins tight", value: 0, desc: "No issue" },
      { label: "Minor looseness", value: 2, desc: "Manageable" },
      { label: "Widespread loose pins", value: 5, desc: "Stability concern" },
      { label: "Pinblock failure", value: 9, desc: "Exit candidate" },
    ],
  },
  playerMechanism: {
    label: "Player Mechanism",
    options: [
      { label: "No player mechanism", value: 0, desc: "N/A" },
      { label: "Player — functional", value: 2, desc: "Adds scope complexity" },
      { label: "Player — needs work", value: 5, desc: "High parts + labor" },
      { label: "Player — non-functional, ignore", value: 1, desc: "Cosmetic only" },
    ],
  },
  brand: {
    label: "Brand / Market Demand",
    options: [
      { label: "Strong demand (Baldwin, Steinway, Yamaha)", value: 0, desc: "Fast mover" },
      { label: "Solid mid-tier (Weber, Kimball, Story & Clark)", value: 1, desc: "Steady demand" },
      { label: "Weak demand (obscure domestic)", value: 3, desc: "Slower turnover" },
      { label: "Very low demand (antique uprights)", value: 5, desc: "Mission or Archive only" },
      { label: "Unknown brand", value: 3, desc: "Treat as weak until assessed" },
    ],
  },
};

const LANE_THRESHOLDS = [
  { max: 5, lane: "Fast Cash", color: "hsl(var(--success))", desc: "Move fast. Stabilize, tune, list. Priority project.", icon: "⚡" },
  { max: 12, lane: "Selective Investment", color: "hsl(var(--warning))", desc: "Moderate scope justified. Watch budget. Set ROI floor before committing.", icon: "🔍" },
  { max: 18, lane: "Diamond / Escalate", color: "hsl(210 60% 65%)", desc: "High friction — requires conscious Diamond decision before acquisition. Don't drift in.", icon: "💎" },
  { max: 99, lane: "Exit / Pass", color: "hsl(var(--destructive))", desc: "Friction too high for current position. Pass or Mission-only.", icon: "🚫" },
];

const FUEL_COST_PER_MILE = 0.21;

function getLane(score: number) {
  return LANE_THRESHOLDS.find((t) => score <= t.max)!;
}

function FactorRow({
  factor,
  value,
  onChange,
}: {
  factor: FrictionFactor;
  value: number | null;
  onChange: (val: number) => void;
}) {
  return (
    <div className="mb-6">
      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 font-mono">
        {factor.label}
      </div>
      <div className="flex flex-wrap gap-2">
        {factor.options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onChange(opt.value)}
            title={opt.desc}
            className={`flex flex-col items-start gap-0.5 rounded-md px-3 py-2 text-xs font-mono transition-all cursor-pointer border ${
              value === opt.value
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/20"
            }`}
          >
            <span className="font-medium">{opt.label}</span>
            <span className="text-[10px] opacity-70">{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AcquisitionTriage() {
  const [scores, setScores] = useState<Record<string, number | null>>({
    distance: null,
    stairs: null,
    strings: null,
    hammers: null,
    pinblock: null,
    playerMechanism: null,
    brand: null,
  });
  const [pianoInfo, setPianoInfo] = useState({
    brand: "",
    type: "Upright",
    asking: "",
    notes: "",
  });
  const [distanceMiles, setDistanceMiles] = useState("");

  const handleScore = (key: string, val: number) =>
    setScores((s) => ({ ...s, [key]: val }));

  const filledCount = Object.values(scores).filter((v) => v !== null).length;
  const totalFactors = Object.keys(scores).length;
  const frictionTotal = Object.values(scores)
    .filter((v): v is number => v !== null)
    .reduce((a, b) => a + b, 0);
  const isComplete = filledCount === totalFactors;
  const lane = isComplete ? getLane(frictionTotal) : null;

  const miles = parseFloat(distanceMiles) || 0;
  const fuelCost = Math.round(miles * 2 * FUEL_COST_PER_MILE);
  const timeCost =
    miles > 60
      ? Math.round((miles / 40) * 2 * 45)
      : Math.round((miles / 35) * 2 * 45);

  const asking = parseFloat(pianoInfo.asking) || 0;
  const maxBid =
    asking > 0 ? Math.max(0, asking - fuelCost - timeCost - 150) : null;

  const resetAll = () => {
    setScores(
      Object.fromEntries(Object.keys(scores).map((k) => [k, null]))
    );
    setDistanceMiles("");
    setPianoInfo({ brand: "", type: "Upright", asking: "", notes: "" });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/inventory"
          className="text-xs text-muted-foreground hover:text-primary font-mono flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3 w-3" /> Inventory
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              Acquisition Triage
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              Go / No-Go Evaluator
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            Base: Saint Cloud, FL 34772
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left — Factors */}
        <div className="space-y-6">
          {/* Piano Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground font-normal">
                Piano Being Evaluated
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-mono">Brand / Make</Label>
                  <Input
                    value={pianoInfo.brand}
                    onChange={(e) =>
                      setPianoInfo((p) => ({ ...p, brand: e.target.value }))
                    }
                    className="font-mono text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-mono">Type</Label>
                  <Input
                    value={pianoInfo.type}
                    onChange={(e) =>
                      setPianoInfo((p) => ({ ...p, type: e.target.value }))
                    }
                    className="font-mono text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-mono">Asking Price ($)</Label>
                  <Input
                    type="number"
                    value={pianoInfo.asking}
                    onChange={(e) =>
                      setPianoInfo((p) => ({ ...p, asking: e.target.value }))
                    }
                    className="font-mono text-sm mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-mono">Quick Notes</Label>
                <Textarea
                  value={pianoInfo.notes}
                  onChange={(e) =>
                    setPianoInfo((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={2}
                  placeholder="Listing details, seller context, first impressions..."
                  className="font-mono text-xs mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Distance input */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                <div className="flex-1">
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Estimated Distance (miles one-way)
                  </Label>
                  <Input
                    type="number"
                    value={distanceMiles}
                    onChange={(e) => setDistanceMiles(e.target.value)}
                    placeholder="e.g. 42"
                    className="w-32 font-mono text-base mt-2"
                  />
                </div>
                {miles > 0 && (
                  <div className="flex gap-5">
                    <div className="text-center">
                      <div className="text-[10px] text-muted-foreground font-mono mb-1">
                        Fuel (R/T)
                      </div>
                      <div className="text-base font-mono font-semibold text-destructive">
                        ${fuelCost}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-muted-foreground font-mono mb-1">
                        Time Cost
                      </div>
                      <div className="text-base font-mono font-semibold text-destructive">
                        ${timeCost}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-muted-foreground font-mono mb-1">
                        Trip Total
                      </div>
                      <div className="text-base font-mono font-bold text-warning">
                        ${fuelCost + timeCost}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Friction Factors */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">
                  Friction Assessment
                </CardTitle>
                <span
                  className={`text-[10px] font-mono ${
                    filledCount === totalFactors
                      ? "text-success"
                      : "text-warning"
                  }`}
                >
                  {filledCount}/{totalFactors} rated
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {Object.entries(FRICTION_FACTORS).map(([k, f]) => (
                <FactorRow
                  key={k}
                  factor={f}
                  value={scores[k]}
                  onChange={(val) => handleScore(k, val)}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right — Verdict Panel */}
        <div className="lg:sticky lg:top-5 space-y-4">
          {/* Live Score */}
          <Card
            className="transition-all"
            style={{
              borderColor: isComplete && lane ? lane.color : undefined,
            }}
          >
            <CardContent className="pt-6">
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-4">
                Friction Score
              </div>
              <div className="flex items-baseline gap-2 mb-5">
                <span
                  className="font-heading text-5xl font-bold leading-none transition-colors"
                  style={{ color: isComplete && lane ? lane.color : "hsl(var(--muted-foreground))" }}
                >
                  {frictionTotal}
                </span>
                <span className="text-lg text-muted-foreground">/ ~36</span>
              </div>

              <Progress
                value={Math.min(100, (frictionTotal / 36) * 100)}
                className="h-1.5 mb-5"
              />

              {isComplete && lane ? (
                <div>
                  <div className="text-3xl mb-2">{lane.icon}</div>
                  <div
                    className="font-heading text-xl font-bold mb-2"
                    style={{ color: lane.color }}
                  >
                    {lane.lane}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {lane.desc}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Rate all {totalFactors} factors to get your verdict →
                </p>
              )}
            </CardContent>
          </Card>

          {/* Travel Economics */}
          {miles > 0 && (
            <Card>
              <CardContent className="pt-5 space-y-2">
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-3">
                  Travel Economics
                </div>
                {[
                  ["Round-trip miles", `${miles * 2} mi`, "text-foreground"],
                  ["Fuel @ $0.21/mi", `$${fuelCost}`, "text-destructive"],
                  ["Drive time value", `$${timeCost}`, "text-destructive"],
                ].map(([label, val, cls]) => (
                  <div
                    key={label}
                    className="flex justify-between text-xs font-mono"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className={cls}>{val}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between text-sm font-mono">
                  <span className="text-muted-foreground">Total trip cost</span>
                  <span className="text-warning font-bold">
                    ${fuelCost + timeCost}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Max Bid Calculator */}
          {asking > 0 && miles > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-5">
                <div className="text-[10px] text-primary font-mono uppercase tracking-widest mb-3">
                  Conservative Max Bid
                </div>
                <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                  Asking ${asking.toLocaleString()} minus trip cost ($
                  {fuelCost + timeCost}) minus friction buffer ($150)
                </p>
                <div
                  className={`font-heading text-2xl font-bold ${
                    maxBid && maxBid > 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {maxBid && maxBid > 0
                    ? `$${maxBid.toLocaleString()}`
                    : "Negative — Pass"}
                </div>
                {maxBid && maxBid > 0 && maxBid < asking && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Negotiate down ${(asking - maxBid).toLocaleString()} from
                    asking
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reset */}
          <Button
            variant="outline"
            onClick={resetAll}
            className="w-full font-mono text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-2" />
            Reset Evaluation
          </Button>
        </div>
      </div>
    </div>
  );
}
