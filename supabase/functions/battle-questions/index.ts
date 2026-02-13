import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getDifficultyFromElo(elo: number): { level: string; description: string } {
  if (elo < 600) return { level: "beginner", description: "basic syntax, simple loops, variable types, and fundamental concepts" };
  if (elo < 900) return { level: "easy", description: "arrays, strings, basic data structures, simple algorithms, and common patterns" };
  if (elo < 1200) return { level: "intermediate", description: "recursion, hash maps, stacks, queues, sorting algorithms, and two-pointer techniques" };
  if (elo < 1500) return { level: "advanced", description: "dynamic programming, graphs, trees, backtracking, and binary search variations" };
  if (elo < 1800) return { level: "expert", description: "advanced graph algorithms, segment trees, tries, complex DP, and system design concepts" };
  return { level: "master", description: "competitive programming problems, advanced data structures, NP-hard approximations, and distributed system design" };
}

const TOPICS = [
  "Arrays & Strings", "Linked Lists", "Stacks & Queues", "Hash Maps",
  "Binary Search", "Sorting", "Recursion", "Trees & BST",
  "Graphs", "Dynamic Programming", "Greedy Algorithms", "Backtracking",
  "Bit Manipulation", "System Design", "OOP Concepts", "Database Concepts",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { elo, questionCount } = body;

    // Validate input
    if (typeof elo !== "number" || elo < 0 || elo > 5000) {
      return new Response(JSON.stringify({ error: "Invalid ELO value" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const count = Math.min(Math.max(questionCount || 5, 3), 7);
    const { level, description } = getDifficultyFromElo(elo);

    // Pick random topics for variety
    const shuffled = [...TOPICS].sort(() => Math.random() - 0.5);
    const selectedTopics = shuffled.slice(0, count);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a competitive programming question generator for a coding battle platform. Generate exactly ${count} multiple-choice questions appropriate for a player with ELO rating ${elo} (${level} level).

The questions should test: ${description}.

Topics to cover: ${selectedTopics.join(", ")}

CRITICAL RULES:
- Each question must have exactly 4 options
- Exactly one option must be correct
- Questions must be fair and unambiguous
- Difficulty must match the ELO level — no discrimination
- Include code snippets when relevant
- Make options plausible (no obvious wrong answers)

You MUST respond using the generate_questions tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate ${count} battle questions for ELO ${elo} (${level} level). Topics: ${selectedTopics.join(", ")}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_questions",
              description: "Generate battle questions for a coding duel",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string", description: "The question text" },
                        code: { type: "string", description: "Optional code snippet" },
                        topic: { type: "string", description: "The topic category" },
                        difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                        options: {
                          type: "array",
                          items: { type: "string" },
                          description: "Exactly 4 answer options",
                        },
                        correctIndex: {
                          type: "number",
                          description: "Index of the correct answer (0-3)",
                        },
                      },
                      required: ["question", "topic", "difficulty", "options", "correctIndex"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_questions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Failed to generate questions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "Failed to parse questions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    // Validate parsed questions
    const questions = parsed.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
      return new Response(JSON.stringify({ error: "No questions generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize and validate each question
    const validQuestions = questions
      .filter((q: any) =>
        q.question && Array.isArray(q.options) && q.options.length === 4 &&
        typeof q.correctIndex === "number" && q.correctIndex >= 0 && q.correctIndex <= 3
      )
      .slice(0, count);

    if (validQuestions.length === 0) {
      return new Response(JSON.stringify({ error: "Question validation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a simulated opponent based on ELO
    const eloVariance = Math.floor(Math.random() * 200) - 100; // ±100 ELO
    const opponentElo = Math.max(0, elo + eloVariance);
    const opponentNames = [
      "ByteStorm", "AlgoQueen", "NeonCoder", "StackHero", "CodeNinja",
      "DevWizard", "BugHunter", "SyntaxSage", "LogicLord", "DataDruid",
      "BitMaster", "CacheCrash", "PixelPunk", "NodeNinja", "QueryKing",
    ];
    const opponent = {
      username: opponentNames[Math.floor(Math.random() * opponentNames.length)],
      elo: opponentElo,
    };

    return new Response(JSON.stringify({ questions: validQuestions, opponent, difficulty: level }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("battle-questions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
