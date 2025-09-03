using System.Text;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using UndertaleModLib.Util;

EnsureDataLoaded();

if (Data.IsYYC())
{
    ScriptError("This game uses YYC (YoYo Compiler), which means the code is embedded into the game executable and cannot be extracted. Make sure you have selected Stoneshard modbranch from Steam Betas.");
    return;
}

ThreadLocal<GlobalDecompileContext> DECOMPILE_CONTEXT = new ThreadLocal<GlobalDecompileContext>(() => new GlobalDecompileContext(Data, false));

int failed = 0;

string extractFolder = PromptChooseDirectory();
if (extractFolder == null)
    throw new ScriptException("The export folder was not set.");

public class Skill
{
    [JsonPropertyName("key")]
    public string Key { get; set; }
    
    [JsonPropertyName("name")]
    public LocalizedText Name { get; set; }

    [JsonPropertyName("tooltip")]
    public LocalizedText Tooltip { get; set; }

    [JsonPropertyName("formulas"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Dictionary<string, string> Formulas { get; set; }

    [JsonPropertyName("is_passive")]
    public bool IsPassive { get; set; }

    [JsonPropertyName("attributes"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public SkillAttributes Attributes { get; set; }
}

public class SkillAttributes
{
    [JsonPropertyName("target")]
    public string Target { get; set; }

    [JsonPropertyName("range")]
    public string Range { get; set; }

    [JsonPropertyName("cooldown")]
    public string Cooldown { get; set; }

    [JsonPropertyName("reserv")]
    public string Reserv { get; set; }

    [JsonPropertyName("duration")]
    public string Duration { get; set; }

    [JsonPropertyName("aoe_length")]
    public string AOELength { get; set; }

    [JsonPropertyName("aoe_width")]
    public string AOEWidth { get; set; }

    [JsonPropertyName("is_movement")]
    public string IsMovement { get; set; }

    [JsonPropertyName("pattern")]
    public string Pattern { get; set; }

    [JsonPropertyName("validators")]
    public string Validators { get; set; }

    [JsonPropertyName("energy")]
    public string Energy { get; set; }

    [JsonPropertyName("class")]
    public string Class { get; set; }

    [JsonPropertyName("bonus_range")]
    public string BonusRange { get; set; }

    [JsonPropertyName("branch")]
    public string Branch { get; set; }

    [JsonPropertyName("is_knockback")]
    public string IsKnockback { get; set; }

    [JsonPropertyName("crime")]
    public string Crime { get; set; }

    [JsonPropertyName("meta_category")]
    public string MetaCategory { get; set; }

    [JsonPropertyName("fumble_chance")]
    public string FumbleChance { get; set; }

    [JsonPropertyName("armor_penetration")]
    public string ArmorPenetration { get; set; }

    [JsonPropertyName("attack")]
    public string Attack { get; set; }

    [JsonPropertyName("stance")]
    public string Stance { get; set; }

    [JsonPropertyName("charge")]
    public string Charge { get; set; }

    [JsonPropertyName("maneuver")]
    public string Maneuver { get; set; }

    [JsonPropertyName("spell")]
    public string Spell { get; set; }
}

public class LocalizedText
{
    [JsonPropertyName("english")]
    public string English { get; set; }

    [JsonPropertyName("russian")]
    public string Russian { get; set; }

    [JsonPropertyName("chinese")]
    public string Chinese { get; set; }

    [JsonPropertyName("german")]
    public string German { get; set; }

    [JsonPropertyName("spanish")]
    public string Spanish { get; set; }

    [JsonPropertyName("french")]
    public string French { get; set; }

    [JsonPropertyName("italian")]
    public string Italian { get; set; }

    [JsonPropertyName("portuguese")]
    public string Portuguese { get; set; }

    [JsonPropertyName("polish")]
    public string Polish { get; set; }

    [JsonPropertyName("turkish")]
    public string Turkish { get; set; }

    [JsonPropertyName("japanese")]
    public string Japanese { get; set; }

    [JsonPropertyName("korean")]
    public string Korean { get; set; }
}

public class EnglishOnlyConverter : JsonConverter<LocalizedText>
{
    public override LocalizedText Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        throw new NotImplementedException();
    }

    public override void Write(Utf8JsonWriter writer, LocalizedText value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        writer.WriteString("english", value.English);
        writer.WriteEndObject();
    }
}

public static readonly IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> baseValuesMap =
new Dictionary<string, IReadOnlyDictionary<string, string>>
{
    ["Mana_Crystal"] = new Dictionary<string, string>
    {
        ["_range"] = "4",
        ["_arcane_damage"] = "10",
        ["_hit_chance"] = "100",
        ["_crt"] = "3",
        ["_crtd"] = "100",
        ["_prc"] = "10"
    },
    ["Astral_Phantasm"] = new Dictionary<string, string>
    {
        ["_arcane_damage"] = "26",
        ["_hit_chance"] = "110",
        ["_crt"] = "12",
        ["_crtd"] = "120",
        ["_prc"] = "10"
    }
};

string jsonPath = Path.Combine("Scripts", "Community Scripts", "stoneshard-skill-keys.json");
var inputSkillTrees = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(File.ReadAllText(jsonPath));
var outputSkillTrees = new Dictionary<string, List<Skill>>();

SetProgressBar("Gathering tooltips and formulas for each skill tree", "Skill trees", 0, inputSkillTrees.Count);
StartProgressBarUpdater();
await Task.Run(() => {
    foreach (var (treeName, inputSkillList) in inputSkillTrees)
    {
        var outputSkillList = new List<Skill>();
        foreach (var skillKey in inputSkillList)
        {
            var skill = new Skill();
            skill.Key = skillKey;
            var gotTooltip = false;
            var gotName = false;
            var lastKey = "";
            foreach (var str in Data.Strings)
            {
                if (!str.Content.Contains(";"))
                    continue;

                var currentKey = skillKey.ToLower() + ";";
                // As long as we've got the tooltip and the name, we ignore all other entries with the same key.
                if (currentKey == lastKey && gotTooltip && gotName)
                {
                    continue;
                }
                if (currentKey != lastKey && gotTooltip && gotName)
                {
                    gotTooltip = false;
                    gotName = false;
                }
                if (str.Content.ToLower().StartsWith(currentKey))
                {
                    string[] subs = str.Content.Split(";");
                    if (subs.Length == 28)
                    {
                        var attributes = new SkillAttributes();
                        attributes.Target = subs[2];
                        attributes.Range = subs[3];
                        attributes.Cooldown = subs[4];
                        attributes.Energy = subs[5];
                        attributes.Reserv = subs[6];
                        attributes.Duration = subs[7];
                        attributes.AOELength = subs[8];
                        attributes.AOEWidth = subs[9];
                        attributes.IsMovement = subs[10];
                        attributes.Pattern = subs[11];
                        attributes.Validators = subs[12];
                        attributes.Class = subs[13];
                        attributes.BonusRange = subs[14];
                        attributes.Branch = subs[16];
                        attributes.IsKnockback = subs[17];
                        attributes.Crime = subs[18];
                        attributes.MetaCategory = subs[19];
                        attributes.FumbleChance = subs[20];
                        attributes.ArmorPenetration = subs[21];
                        attributes.Attack = subs[22];
                        attributes.Stance = subs[23];
                        attributes.Charge = subs[24];
                        attributes.Maneuver = subs[25];
                        attributes.Spell = subs[26];
                        skill.Attributes = attributes;
                    }
                    // Translated tooltip or name. Tooltip comes first.
                    if (subs.Length == 14)
                    {
                        if (!gotTooltip)
                        {
                            var tooltip = new LocalizedText();
                            tooltip.Russian = subs[1];
                            tooltip.English = subs[2];
                            tooltip.Chinese = subs[3];
                            tooltip.German = subs[4];
                            tooltip.Spanish = subs[5];
                            tooltip.French = subs[6];
                            tooltip.Italian = subs[7];
                            tooltip.Portuguese = subs[8];
                            tooltip.Polish = subs[9];
                            tooltip.Turkish = subs[10];
                            tooltip.Japanese = subs[11];
                            tooltip.Korean = subs[12];
                            skill.Tooltip = tooltip;
                            gotTooltip = true;
                            continue;
                        }
                        if (!gotName)
                        {
                            var name = new LocalizedText();
                            name.Russian = subs[1];
                            name.English = subs[2];
                            name.Chinese = subs[3];
                            name.German = subs[4];
                            name.Spanish = subs[5];
                            name.French = subs[6];
                            name.Italian = subs[7];
                            name.Portuguese = subs[8];
                            name.Polish = subs[9];
                            name.Turkish = subs[10];
                            name.Japanese = subs[11];
                            name.Korean = subs[12];
                            skill.Name = name;
                            gotName = true;
                            lastKey = skillKey.ToLower() + ";";
                        }
                    }
                }
            }
            // Gather formulas from Code.   
            foreach (UndertaleCode code in Data.Code)
            {
                if (code.Name.Content.ToLower().StartsWith("gml_object_o_pass_skill_" + skillKey.ToLower()))
                {
                    skill.IsPassive = true;
                }
                // We gather gml objects that end with _Other_17 as it seems the formulas are stored there.
                if (code.Name.Content.ToLower() == "gml_object_o_skill_" + skillKey.ToLower() + "_other_17" || code.Name.Content.ToLower() == "gml_object_o_pass_skill_" + skillKey.ToLower() + "_other_17")
                {
                    var formulas = code != null ? Decompiler.Decompile(code, DECOMPILE_CONTEXT.Value) : "";
                    skill.Formulas = ParseFormulas(formulas);
                    foreach (var formula in skill.Formulas)
                    {
                        if (!baseValuesMap.ContainsKey(skill.Key))
                        {
                            continue;    
                        }
                        foreach (var baseValues in baseValuesMap[skill.Key])
                        {
                            if (formula.Value.Contains(baseValues.Key))
                            {
                                skill.Formulas[formula.Key] = formula.Value.Replace(baseValues.Key, baseValues.Value);
                            }
                        }
                    }
                }
            }
            outputSkillList.Add(skill);
        }
        outputSkillTrees[treeName] = outputSkillList;
        IncrementProgress();
    }
    string tooltipsAndFormulasExportPath = Path.Combine(extractFolder, "stoneshard-tooltips-and-formulas.json");

    var options = new JsonSerializerOptions
    {
        WriteIndented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };
    options.Converters.Add(new EnglishOnlyConverter());
    File.WriteAllText(tooltipsAndFormulasExportPath, JsonSerializer.Serialize(outputSkillTrees, options) + Environment.NewLine);
});

await StopProgressBarUpdater();

public static Dictionary<string, string> ParseFormulas(string lines)
{
    var formulas = new Dictionary<string, string>();

    var regex = new Regex(@"ds_map_replace\([^,]+,\s*""([^""]+)"",\s*(.+)\)");

    var matches = regex.Matches(lines);
    foreach (Match match in matches)
    {
        string key = match.Groups[1].Value;
        string value = match.Groups[2].Value;

        value = value.Replace("owner.", "");

        formulas[key] = value;
    }

    return formulas;
}
