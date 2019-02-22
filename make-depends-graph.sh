# Extract file dependency graph.
# works best when some false-positive files are removed, like REDAME and __init__.py

# approximate search for files mentioning the names of other files, producing dot graph output. Uses ag (the-silver-searcher)
(echo -e 'digraph dependencies {\n graph [ratio=3,rankdir=LR];'; for F in $(find * -type f); do G=${F##*/}; H=${G%.*}; for use in $(ag -l -s '\b'$H'\b'); do echo "\"$use\" -> \"$F\";"; done ; done; echo '}') > ../depends.dot

# make pdf file:
dot -Tpdf ../depends.dot > depends.pdf

# can also be queried as text, e.g. to find all roots: 
echo 'files that seem to be not used by anything:'
for f  in $(find * -type f); do grep -q "[-]> \"$f" ../depends.dot || echo $f; done

echo 'files that seem to not use anything:'
for f  in $(find * -type f); do grep -q "$f\" ->" ../depends.dot || echo $f; done
