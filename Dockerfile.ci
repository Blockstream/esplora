FROM hashicorp/terraform@sha256:ee36fc76714ea8b57564c52e98bd66fc222368e57f3a00e24ac9b73b85f33cbe AS terraform
FROM docker@sha256:16a1f4b3e64c5a8e1ac80987bc2b8907dbc1c79c1b13be0781f4d24a2072e698

COPY --from=terraform /bin/terraform /bin/terraform

ENV CLOUD_SDK_VERSION="248.0.0"
ENV PATH=/opt/google-cloud-sdk/bin:$PATH

WORKDIR /opt

RUN wget https://github.com/DeviaVir/terraform-provider-customconfig/releases/download/v0.1.0/terraform-provider-customconfig_0.1.0_linux_amd64.tgz \
 && tar xzf terraform-provider-customconfig_0.1.0_linux_amd64.tgz \
 && mkdir -p $HOME/.terraform.d/plugins/ \
 && mv terraform-provider-customconfig_v0.1.0 $HOME/.terraform.d/plugins/

RUN apk --no-cache add curl python py-crcmod bash libc6-compat openssh-client git gnupg ansible \
 && curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-${CLOUD_SDK_VERSION}-linux-x86_64.tar.gz \
 && tar xzf google-cloud-sdk-${CLOUD_SDK_VERSION}-linux-x86_64.tar.gz \
 && rm google-cloud-sdk-${CLOUD_SDK_VERSION}-linux-x86_64.tar.gz \
 && ln -s /lib /lib64

RUN /opt/google-cloud-sdk/bin/gcloud config set core/disable_usage_reporting true \
 && /opt/google-cloud-sdk/bin/gcloud config set component_manager/disable_update_check true \
 && /opt/google-cloud-sdk/bin/gcloud config set metrics/environment github_docker_image \
 && /opt/google-cloud-sdk/bin/gcloud auth configure-docker
