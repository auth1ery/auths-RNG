#!/usr/bin/env fish

set target (test -n "$argv[1]"; and echo $argv[1]; or echo "assets/scripts")
set report_dir "./analysis/report"
set tools_dir (dirname (status -f))
mkdir -p $report_dir

function run_npx
    npx --yes $argv
end

echo "== static analysis: $target =="

echo "== eslint pass =="
run_npx eslint $target -f json > $report_dir/eslint.json 2>$report_dir/eslint.stderr.log
echo "eslint done -> $report_dir/eslint.json"

echo "== tsc pass (tsconfig.json) =="
run_npx tsc --noEmit > $report_dir/tsc.log 2>&1
echo "tsc done -> $report_dir/tsc.log"

echo "== tsc checkJs pass on plain JS =="
run_npx tsc --allowJs --checkJs --noEmit --target es2022 --moduleResolution node \
    $target/*.js $target/engine/*.js $target/systems/*.js $target/services/*.js \
    > $report_dir/tsc-checkjs.log 2>&1
echo "checkJs done -> $report_dir/tsc-checkjs.log"

if test -f package.json
    echo "== knip pass =="
    run_npx knip --reporter json > $report_dir/knip.json 2>$report_dir/knip.stderr.log
    echo "knip done -> $report_dir/knip.json"
end

set css_files (find $target -name "*.css" -not -path "*archive*")
if test -n "$css_files"
    echo "== stylelint pass =="
    run_npx stylelint "$target/**/*.css" --formatter json > $report_dir/stylelint.json 2>$report_dir/stylelint.stderr.log
    echo "stylelint done -> $report_dir/stylelint.json"
end

echo "== leak heuristic pass =="
set leak_report "$report_dir/leak-heuristic.txt"
echo "file, addEventListener, removeEventListener, setInterval, clearInterval, requestAnimationFrame, cancelAnimationFrame" > $leak_report

for file in (find $target -name "*.js" -not -path "*archive*")
    set add_count (grep -c "addEventListener(" $file)
    set remove_count (grep -c "removeEventListener(" $file)
    set seti_count (grep -c "setInterval(" $file)
    set cleari_count (grep -c "clearInterval(" $file)
    set raf_count (grep -c "requestAnimationFrame(" $file)
    set craf_count (grep -c "cancelAnimationFrame(" $file)

    if test $add_count -gt $remove_count; or test $seti_count -gt $cleari_count; or test $raf_count -gt $craf_count
        echo "$file, $add_count, $remove_count, $seti_count, $cleari_count, $raf_count, $craf_count" >> $leak_report
    end
end
echo "leak heuristic done -> $leak_report"

echo "== method consistency pass =="
node $tools_dir/method-consistency-check.js $target > $report_dir/method-consistency.txt 2>&1
echo "method consistency done -> $report_dir/method-consistency.txt"

echo "== broken link check =="
node $tools_dir/broken-links-check.js . > $report_dir/broken-links.txt 2>&1
echo "broken link check done -> $report_dir/broken-links.txt"

echo "== tab-out guard check =="
node $tools_dir/tab-out-guard-check.js $target > $report_dir/tab-out-guard.txt 2>&1
echo "tab-out guard done -> $report_dir/tab-out-guard.txt"

echo "== stale global check =="
node $tools_dir/stale-global-check.js $target > $report_dir/stale-globals.txt 2>&1
echo "stale global check done -> $report_dir/stale-globals.txt"

echo ""
echo "== summary =="
echo "reports written to $report_dir/"
echo "leak heuristic and stale-global checks are pattern-based, not dataflow, false positives happen. read flagged files, don't trust counts blindly."