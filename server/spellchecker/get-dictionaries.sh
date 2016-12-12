#!/bin/sh
BASEURL=https://cgit.freedesktop.org/libreoffice/dictionaries/plain

if [ ! -d "en" ]; then
  mkdir en
fi
wget -O en/en_US.aff $BASEURL/en/en_US.aff
wget -O en/en_US.dic $BASEURL/en/en_US.dic
wget -O en/en_GB.aff $BASEURL/en/en_GB.aff
wget -O en/en_GB.dic $BASEURL/en/en_GB.dic
wget -O en/license.txt $BASEURL/en/license.txt

if [ ! -d "sv" ]; then
  mkdir sv
fi
wget -O sv/sv_SE.aff $BASEURL/sv_SE/sv_SE.aff
wget -O sv/sv_SE.dic $BASEURL/sv_SE/sv_SE.dic
wget -O sv/sv_FI.aff $BASEURL/sv_SE/sv_FI.aff
wget -O sv/sv_FI.dic $BASEURL/sv_SE/sv_FI.dic
wget -O sv/license.txt $BASEURL/sv/LICENSE_en_US.txt

if [ ! -d "da" ]; then
  mkdir da
fi
wget -O da/da_DK.aff $BASEURL/da_DK/da_DK.aff
wget -O da/da_DK.dic $BASEURL/da_DK/da_DK.dic
wget -O da/license.txt $BASEURL/da_DK/README_da_DK.txt

if [ ! -d "no" ]; then
  mkdir no
fi
wget -O no/nb_NO.aff $BASEURL/no/nb_NO.aff
wget -O no/nb_NO.dic $BASEURL/no/nb_NO.dic
wget -O no/nn_NO.aff $BASEURL/no/nn_NO.aff
wget -O no/nn_NO.dic $BASEURL/no/nn_NO.dic
wget -O no/license.txt $BASEURL/no/COPYING

if [ ! -d "nl" ]; then
  mkdir nl
fi

wget -O nl/nl_NL.aff $BASEURL/nl_NL/nl_NL.aff
wget -O nl/nl_NL.dic $BASEURL/nl_NL/nl_NL.dic
wget -O nl/license.txt $BASEURL/nl_NL/license_en_EN.txt

if [ ! -d "fr" ]; then
  mkdir fr
fi
wget -O fr/fr_FR.aff $BASEURL/fr_FR/fr.aff
wget -O fr/fr_FR.dic $BASEURL/fr_FR/fr.dic
wget -O fr/license.txt $BASEURL/fr_FR/README_fr.txt

if [ ! -d "de" ]; then
  mkdir de
fi
wget -O de/de_DE.aff $BASEURL/de/de_DE_frami.aff
wget -O de/de_DE.dic $BASEURL/de/de_DE_frami.dic
wget -O de/license.txt $BASEURL/de/COPYING_GPLv3
